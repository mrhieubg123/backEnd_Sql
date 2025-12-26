import requests
from pyzbar.pyzbar import decode
import numpy as np
import cv2
import time, re
import serial
from numba import jit, prange
import socket
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def readTextTesseract(
    img,
    psm: int = 7,
    whitelist: str = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-",
    lang: str = "typoup",
    debug: bool = False
):
    config = f"--oem 1 --psm {psm}"
    if whitelist:
        config += f" -c tessedit_char_whitelist={whitelist}"

    text = pytesseract.image_to_string(img, lang=lang, config=config)
    text_clean = re.sub(r"\s+", " ", text).strip()

    if debug:
        print("Raw OCR:", repr(text))
        print("Clean OCR:", repr(text_clean))

    return text_clean


def sendResultToSFC(qrcode_Final):
    data = {'status': 'PASS', 'dut_id': qrcode_Final, 'station_id': 'AOI1', 'data': {}, 'test_log': {}}
    try:
        response = requests.post(f'https://bn3sfc-api.cns.myfiinet.com/sfcapi/api/connectfinal', json=data, verify=False)
        result = response.json()
        print(result)
        if result['result'] == 'PASS':
            return True, result['message']
        else:
            return False, result['message']
    except Exception as e:
        print(e)
        return True, 'Can not connect to SFC'

@jit(nopython=True, parallel=True)
def enegry(img, imgtemp, delta=1):
    # imgtemp = cv2.copyMakeBorder(img, delta, delta, delta, delta, borderType=cv2.BORDER_REPLICATE)
    mask_coeff = ((delta * 2) + 1) * ((delta * 2) + 1)
    h, w = img.shape
    imgout = img.copy()
    for i in prange(delta, h + delta):
        for j in prange(delta, w + delta):
            Value1 = 0
            for h in prange(i - delta, i + delta + 1):
                for k in prange(j - delta, j + delta + 1):
                    Value1 += imgtemp[h, k]
            Mean = Value1 / mask_coeff
            Value2 = 0
            for h in prange(i - delta, i + delta + 1):
                for k in prange(j - delta, j + delta + 1):
                    Value2 += ((imgtemp[h, k] - Mean) * (imgtemp[h, k] - Mean))
            Value2 = Value2 / mask_coeff
            Value2 = 255 if Value2 > 255 else Value2
            Value2 = 0 if Value2 < 0 else Value2
            imgout[i - delta, j - delta] = int(Value2)
    return imgout

@jit(nopython=True, parallel=True)
def blackclear(img, imgtemp, delta):
    # imgtemp = cv2.copyMakeBorder(img, delta, delta, delta, delta, borderType=cv2.BORDER_REPLICATE)
    h, w = img.shape
    imgout = img.copy()
    for i in prange(delta, h + delta):
        for j in prange(delta, w + delta):
            Value = 0
            val2 = 0
            maxval = 0
            for h in prange(i - delta, i + delta + 1):
                for k in prange(j - delta, j + delta + 1):
                    if imgtemp[h, k] > 10:
                        Value = Value + 1
                        val2 = val2 + img[h, k]
                    if imgtemp[h, k] > maxval:
                        maxval = imgtemp[h, k]
            if Value > 40:
                imgout[i - delta, j - delta] = maxval  # int(val2/25)
            if Value <= 40:
                imgout[i - delta, j - delta] = int(val2 / 25)
    return imgout

def findContour(img, imgene):
    # img_temp = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    kernel = np.ones((3, 3), np.uint8)
    ret, thresh1 = cv2.threshold(imgene, 30, 255, cv2.THRESH_BINARY)
    opening = cv2.morphologyEx(thresh1, cv2.MORPH_CLOSE, kernel, iterations=1)
    contours, _ = cv2.findContours(opening, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        # max_contour = max(contours, key=cv2.contourArea)
        # epsilon = 0.001 * cv2.arcLength(max_contour, True)
        # max_contour = cv2.approxPolyDP(max_contour, epsilon, True)
        rect = cv2.minAreaRect(contour)
        box = cv2.boxPoints(rect)
        box = np.intp(box)
        x, y, w, h = cv2.boundingRect(contour)
        if w > 5 or h > 5:
            cv2.drawContours(img, [box], 0, (0, 0, 255), 3)

class PCXLightControl:
    def __init__(self, port_name="COM6", baudrate=115200):
        self.port = serial.Serial(
            port=port_name,
            baudrate=baudrate,
            bytesize=serial.EIGHTBITS,
            stopbits=serial.STOPBITS_ONE,
            parity=serial.PARITY_NONE,
            timeout=4,
            write_timeout=4
        )

    def open(self):
        """Open the serial port if not already open."""
        if not self.port.is_open:
            try:
                print(f"Opening port: {self.port.port}")
                self.port.open()
                return True
            except Exception as e:
                print(f"Error opening port: {e}")
                return False
        print(f"Port {self.port.port} is already open.")
        return True

    def close(self):
        """Close the serial port."""
        try:
            self.port.close()
            return True
        except Exception as e:
            print(f"Error closing port: {e}")
            return False

    def send_command(self, command):
        """Send a command and wait for a response."""
        try:
            self.port.write(command)
            response = self.port.read_all()  # Read all available data
            return True
        except Exception as e:
            print(f"Error sending command: {e}")
            return False

    def turn_on_all(self):
        """Turn on all lights."""
        command = bytes([0x02, 0x06, 0x86, 0xFF, 0x00, 0x03])
        return self.send_command(command)

    def turn_off_all(self):
        """Turn off all lights."""
        command = bytes([0x02, 0x06, 0x86, 0x00, 0x00, 0x03])
        return self.send_command(command)

    def set_brightness(self, channel, value):
        """Set brightness for a specific channel."""
        command = bytes([0x02, 0x08, 0x80, channel, 0x01, value, 0x00, 0x03])
        return self.send_command(command)

    def set_strobe(self, channel, light_time_us):
        """Set strobe light for a specific channel."""
        value = min(light_time_us // 100, 0xFFFF)
        command = bytes([0x02, 0x08, 0x90, channel, (value >> 8) & 0xFF, value & 0xFF, 0x00, 0x03])
        return self.send_command(command)

def readMatrixCode(img):
    return ''

def readSNcode(img, tesmode):
    print('read SN')
    blur = img.copy()
    if len(img.shape) == 3:
        blur = cv2.cvtColor(blur, cv2.COLOR_BGR2GRAY)
    blur = cv2.blur(blur, (1, 30))
    decoded_objects = decode(blur)
    if len(decoded_objects) > 0:
        for obj in decoded_objects:
            data = obj.data.decode()
            (x, y, w, h) = obj.rect
            cv2.rectangle(img, (x - 10, y - 10), (x + w + 10, y + h + 10), (0, 0, 255), 2)
            return data
    if not tesmode:
        dens = np.sum(blur, axis=0)
        mean = np.mean(dens)
        thresh = blur.copy()
        for ii in range(int(mean - 1000), int(mean + 1000), 50):
            for idx, val in enumerate(dens):
                if val < ii:
                    thresh[:, idx] = 0
                else:
                    thresh[:, idx] = 255

            decoded_objects = decode(thresh)
            if len(decoded_objects) > 0:
                for obj in decoded_objects:
                    data = obj.data.decode()
                    return data
                break
    return ''

def readQRcode(qrdetector, img):
    dataqr = qrdetector.detectAndDecode(img)
    if len(dataqr[0]) > 0:
        print(dataqr[0])
        for i in dataqr[1]:
            point1 = [i[0][0], i[0][1]]
            point2 = [i[2][0], i[2][1]]
            point3 = [i[1][0], i[1][1]]
            point4 = [i[3][0], i[3][1]]
            points = np.array([point1, point3, point2, point4], np.int32).reshape((-1, 1, 2))
            cv2.polylines(img, [points], isClosed=True, color=(0, 0, 255), thickness=4)
        return dataqr[0][0]
    else:
        return ""

def send_qr_pair(SERVER_URL, QRZig, QRproduct):
    try:
        response = requests.post(f'{SERVER_URL}/store_qr_pair', json={'QRZig': QRZig, 'QRproduct': QRproduct})
        if response.status_code == 200:
            print('QR code pair stored successfully')
            return True
        else:
            print(f'Failed to store QR code pair: {response.status_code}')
            return False
    except Exception as e:
        print(f'Error occurred: {e}')
        return False

def get_QRproduct(SERVER_URL, QRZig):
    try:
        response = requests.get(f'{SERVER_URL}/get_QRproduct', params={'QRZig': QRZig})
        if response.status_code == 200:
            QRproduct = response.json().get('QRproduct', '')
            if QRproduct:
                print(f'QR code product: {QRproduct}')
                return QRproduct
            else:
                print('QR code not found.')
                return ''
        else:
            print(f'Failed to retrieve QR code: {response.status_code}')
            return ''

    except Exception as e:
        print(f'Error occurred: {e}')
        return ''

def send_qr_status(SN):
    """
    Gửi QR code (SN) lên API để lấy trạng thái sản phẩm
    """
    SERVER_URL = "https://mesht-cns.myfiinet.com"
    payload = {
        "IN_DB": "SFCHT",
        "IN_SP": "SFIS1.MET_API",
        "IN_EVENT": "GET_STATUS",
        "IN_DATA": {"SN": SN}
    }
    try:
        response = requests.post(f"{SERVER_URL}/MESAPI/api/MES/CallAPI", json=payload)

        if response.status_code == 200:
            data = response.json()
            print("Server response:", data)
            return data
        else:
            print(f"Request failed, status code: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error occurred: {e}")
        return None
    
class Mylib:
    def __init__(self, plc, severurl, machinename, YOLO):
        super().__init__()
        self.qrCodeData = ''
        self.PLC = plc
        self.severURL = severurl
        self.machineName = machinename
        self.qrCodedetector = cv2.wechat_qrcode_WeChatQRCode("wechat_qr_code/detect.prototxt",
                                                             "wechat_qr_code/detect.caffemodel",
                                                             "wechat_qr_code/sr.prototxt",
                                                             "wechat_qr_code/sr.caffemodel")
        self.connectLight_ok = False
        try:
            self.PCXLight = PCXLightControl('COM6')
            self.connectLight_ok = True
        except Exception as err:
            print(err)
            self.connectLight_ok = False
        
        #QR_BARCODE
        self.sn_qr_sn = ''
        self.sn_qr_cm = ''
        self.sn_qr_mta = ''
        self.sn_qr_wan = ''
        self.sn_bar1 = ''
        self.sn_bar2 = ''
        #OCR
        self.ocr_sn = ''
        self.ocr_cm = ''
        self.ocr_mta = ''
        self.ocr_wan = ''

    def moduleFunctionQrcode(self, img, checkmode, testMode, pointcheck):
        try:
            if pointcheck in ('GET_QR', 'GET_SN1', 'GET_SN2', 'GET_1QR'):
                if checkmode not in ('QR Code', 'Scanner'):
                    return False, '', f'Sai checkmode: {checkmode}'
                qrCodeData = readQRcode(self.qrCodedetector, img) or ''
                if isinstance(qrCodeData, tuple):
                    qrCodeData = qrCodeData[0]
                qrCodeData = str(qrCodeData)
                if qrCodeData == '':
                    qrCodeData = readSNcode(img, testMode) or ''
                if not qrCodeData:
                    return False, '', 'Can not read QR'
                sn_value = qrCodeData.strip()
                if not testMode:
                    if pointcheck == 'GET_QR' or pointcheck == 'GET_1QR':
                        self.sn_qr = sn_value
                        parts = self.sn_qr.split('.')
                        if len(parts) >= 6:
                            self.sn_qr_sn  = parts[2]  # 5103008546502272
                            self.sn_qr_cm  = parts[3]  # 50BB9FCD5AB9
                            self.sn_qr_mta = parts[4]  # 50BB9FCD5ABA
                            self.sn_qr_wan = parts[5]  # 50BB9FCD5ABB
                        else:
                            print("QR format khong dung")
                        return True, self.sn_qr, 'Read QR OK'
                    elif pointcheck == 'GET_SN1':
                        self.sn_bar1 = sn_value
                        return True, sn_value, 'Read SN1 OK'
                    elif pointcheck == 'GET_SN2':
                        self.sn_bar2 = sn_value
                        return True, sn_value, 'Read SN2 OK'
                else:
                    return True, sn_value, f'Read SN for {pointcheck} (test mode)'
                
            if pointcheck == 'OCR_SN':
                text = readTextTesseract(img, whitelist=":0123456789", psm=6)
                if not text:
                    return False, '', 'Can not read OCR'
                text_value = text.replace('\n', ' ').strip()
                m = re.search(r":\s*([0-9]{16})", text_value)
                if not m:
                    return False, text_value, 'Can not find SN'
                sn = m.group(1)
                if not testMode:
                    self.ocr_sn = sn     
                    return True, sn, 'Read OCR_SN OK'
                else:
                    # print("OCR_SN doc duoc:", text_value)
                    print("Lay SN: ", sn)
                    return True, sn, f'Read OCR for {pointcheck} (test mode)'

            if pointcheck == 'OCR_three_dong' or pointcheck == 'OCR_three_dong_1qr':
                if pointcheck == 'OCR_three_dong_1qr':
                    self.sn_bar1 = ''
                    self.sn_bar2 = ''
                text = readTextTesseract(img, whitelist="0123456789ABCDEF:", psm=6)
                if not text:
                    return False, '', 'Can not read OCR'
                
                text_value = text.replace('\n', ' ').strip().upper()
                macs = re.findall(r":\s*([0-9A-F]{12})", text_value)
                if len(macs) < 3:
                    return False, text_value, f'Found {len(macs)} MAC(s), need 3'
                cm_mac, mta_mac, wan_mac = macs[0], macs[1], macs[2]
                macs_str = f"CM MAC:{cm_mac} | MTA MAC:{mta_mac} | WAN MAC:{wan_mac}"

                if not testMode:
                    self.ocr_cm  = cm_mac
                    self.ocr_mta = mta_mac
                    self.ocr_wan = wan_mac
                    return True, macs_str, 'Read OCR_Three_dong OK'
                else:
                    # print("OCR_three_dong (raw):", text_value)
                    # print("MACs:", macs)
                    print("CM:", cm_mac, "MTA:", mta_mac, "WAN:", wan_mac)
                    return True, macs_str, f'Read OCR for {pointcheck} (test mode)'
            
            elif pointcheck == 'sosanh':
                if self.sn_bar1 == '' and self.sn_bar2 == '':
                    errors = []
                    if self.sn_qr_cm != self.ocr_cm:
                        errors.append(
                            f"CM MAC KHONG KHOP: QR={self.sn_qr_cm}, OCR={self.ocr_cm}, {self.sn_bar1}, {self.sn_bar2}"
                        )
                    if self.sn_qr_mta != self.ocr_mta:
                        errors.append(
                            f"MTA MAC KHONG KHOP: QR={self.sn_qr_mta}, OCR={self.ocr_mta}"
                        )
                    if self.sn_qr_wan != self.ocr_wan:
                        errors.append(
                            f"WAN MAC KHONG KHOP: QR={self.sn_qr_wan}, OCR={self.ocr_wan}"
                        )
                    if not errors:
                        msg = "Thong so khop"
                        print(msg)
                        return True, '', msg
                    else:
                        msg = " ; ".join(errors)
                        print(msg)
                        return False, '', msg
                else:
                    errors = []
                    if not (self.sn_qr_sn == self.sn_bar1 == self.ocr_sn):
                        errors.append(
                            f"SN KHONG KHOP: QR={self.sn_qr_sn}, BAR1={self.sn_bar1}, OCR={self.ocr_sn}"
                        )
                    if not (self.sn_qr_cm == self.ocr_cm == self.sn_bar2):
                        errors.append(
                            f"CM MAC KHONG KHOP: QR={self.sn_qr_cm}, OCR={self.ocr_cm}, BAR2={self.sn_bar2}"
                        )
                    if self.sn_qr_mta != self.ocr_mta:
                        errors.append(
                            f"MTA MAC KHONG KHOP: QR={self.sn_qr_mta}, OCR={self.ocr_mta}"
                        )
                    if self.sn_qr_wan != self.ocr_wan:
                        errors.append(
                            f"WAN MAC KHONG KHOP: QR={self.sn_qr_wan}, OCR={self.ocr_wan}"
                        )
                    if not errors:
                        msg = "Thong so khop"
                        print(msg)
                        return True, '', msg
                    else:
                        msg = " ; ".join(errors)
                        print(msg)
                        return False, '', msg

        except Exception as er:
            return False, '', str(er)



        except Exception as er:
            return False, '', str(er)


    def moduleFunctionSendData(self, pointcheck):
       return True

    def moduleFunctionMultiPoint(self, pointcheck, listdata):
        print(listdata)
        soluongpass = 0
        result = False
        for re in listdata:
            if re[0]:
                result = True
                soluongpass = soluongpass + 1
        if pointcheck == 'tray1':
            self.PLC.batchwrite_wordunits(headdevice="D102", values=[soluongpass])
            if result:
                j = 0
                move = 0
                for i in range(2000, 2051, 10):
                    if listdata[move][0]:
                        toadomoi_x = self.toadogoc_May_1[f'D{i}'] + listdata[move][1]
                        self.PLC.randomwrite(['D6'], [0], [f'D{j}'], [toadomoi_x])
                        toadomoi_y = self.toadogoc_May_1[f'D{i+2}'] + listdata[move][2]
                        self.PLC.randomwrite(['D6'], [0], [f'D{j+2}'], [toadomoi_y])
                        toadomoi_z = self.toadogoc_May_1[f'D{i+4}'] + 0
                        self.PLC.randomwrite(['D6'], [0], [f'D{j+4}'], [toadomoi_z])
                        toadomoi_r = self.toadogoc_May_1[f'D{i+6}'] + 0
                        self.PLC.randomwrite(['D6'], [0], [f'D{j+6}'], [toadomoi_r])
                        j = j + 10
                    move = move + 1

                j = 0
                move = 0
                for i in range(2060, 2121, 10):
                    if listdata[move][0]:
                        toadomoi_x = self.toadogoc_May_1[f'D{i}'] + listdata[move][1]
                        self.PLC.randomwrite(['D6'], [0], [f'D{j}'], [toadomoi_x])
                        toadomoi_y = self.toadogoc_May_1[f'D{i + 2}'] + listdata[move][2]
                        self.PLC.randomwrite(['D6'], [0], [f'D{j + 2}'], [toadomoi_y])
                        toadomoi_z = self.toadogoc_May_1[f'D{i + 4}'] + 0
                        self.PLC.randomwrite(['D6'], [0], [f'D{j + 4}'], [toadomoi_z])
                        toadomoi_r = self.toadogoc_May_1[f'D{i + 6}'] + 0
                        self.PLC.randomwrite(['D6'], [0], [f'D{j + 6}'], [toadomoi_r])
                        j = j + 10
                    move = move + 1
                j = 0
                move = 0
                for i in range(2130, 2200, 10):
                    if listdata[move][0]:
                        toadomoi_x = self.toadogoc_May_1[f'D{i}'] + listdata[move][1]
                        self.PLC.randomwrite(['D6'], [0], [f'D{j}'], [toadomoi_x])
                        toadomoi_y = self.toadogoc_May_1[f'D{i + 2}'] + listdata[move][2]
                        self.PLC.randomwrite(['D6'], [0], [f'D{j + 2}'], [toadomoi_y])
                        toadomoi_z = self.toadogoc_May_1[f'D{i + 4}'] + 0
                        self.PLC.randomwrite(['D6'], [0], [f'D{j + 4}'], [toadomoi_z])
                        toadomoi_r = self.toadogoc_May_1[f'D{i + 6}'] + 0
                        self.PLC.randomwrite(['D6'], [0], [f'D{j + 6}'], [toadomoi_r])
                        j = j + 10
                    move = move + 1
                self.PLC.batchwrite_wordunits(headdevice="D101", values=[1])
            else:
                self.PLC.batchwrite_wordunits(headdevice="D102", values=[0])
                self.PLC.batchwrite_wordunits(headdevice="D101", values=[2])
        return True

    def moduleFunctionOther(self, pointcheck):
        return ''

    def moduleFunctionLightcontrol(self, CH, lightValue, lightDelay, pointcheck, triggerMode):
        if self.connectLight_ok and lightValue != '-1' and triggerMode == 'Off':
            try:
                print(int(CH[-1]) - 1, lightValue)
                lightValue = int(lightValue)
                if lightDelay != '' and lightDelay != '0':
                    lightDelay = int(float(lightDelay)*1000)
                result = self.PCXLight.set_brightness(int(CH[-1]) - 1, lightValue)
                if lightDelay != '' and lightDelay != '0':
                    cv2.waitKey(lightDelay)
            except Exception as err:
                print(err)
        pass

    def moduleFunctionBeforCheck(self, pointcheck):
        return ''

    def moduleFunctionAfterCheck(self, imgTemp, pointcheck, pointCheckdata, checkresult):
        return ''