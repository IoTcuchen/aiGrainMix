import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text_from_pptx(pptx_path):
    if not os.path.exists(pptx_path):
        return f"File not found: {pptx_path}\n"
        
    text = ""
    try:
        with zipfile.ZipFile(pptx_path, 'r') as zf:
            slide_files = [f for f in zf.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            slide_files.sort(key=lambda x: int(x.replace('ppt/slides/slide', '').replace('.xml', '')))
            
            for idx, slide_file in enumerate(slide_files, 1):
                text += f"Slide {idx}:\n"
                xml_content = zf.read(slide_file)
                root = ET.fromstring(xml_content)
                ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
                for node in root.findall('.//a:t', ns):
                    if node.text:
                        text += node.text + " "
                text += "\n---\n"
    except Exception as e:
        text += f"Error parsing zip: {e}\n"
    return text

report1 = extract_text_from_pptx(r"D:\cuchenSW\250903_쿠첸ON_Data 정리_app취사집계.pptx")
report2 = extract_text_from_pptx(r"D:\cuchenSW\240823_쿠첸ON_Data 정리_8.pptx")

with open("out_pptx.txt", "w", encoding="utf-8") as f:
    f.write("=== REPORT 1 (250903_쿠첸ON_Data 정리_app취사집계.pptx) ===\n")
    f.write(report1)
    f.write("\n=== REPORT 2 (240823_쿠첸ON_Data 정리_8.pptx) ===\n")
    f.write(report2)
