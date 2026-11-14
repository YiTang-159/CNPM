#!/usr/bin/env python3
"""Terminal QR is optional. The URL is also printed by npm run lan."""
import sys
try:
 import qrcode
except ImportError:
 sys.exit('Chưa có thư viện qrcode: python -m pip install qrcode (URL vẫn dùng được).')
qr=qrcode.QRCode(border=1, box_size=1)
qr.add_data(sys.argv[1]); qr.make(fit=True)
qr.print_ascii(invert=True)
