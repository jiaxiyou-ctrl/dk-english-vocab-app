import fitz
import os

PDF_PATH = os.path.join(os.path.dirname(__file__), '..', 'DK中英双语10000词.pdf')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'assets', 'images')

def extract_pages(page_numbers):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    doc = fitz.open(PDF_PATH)
    for page_num in page_numbers:
        page = doc[page_num - 1]
        pix = page.get_pixmap(dpi=200)
        output_path = os.path.join(OUTPUT_DIR, f'page_{page_num}.jpg')
        pix.save(output_path)
        print(f'Saved page {page_num} -> {output_path}')
    doc.close()

if __name__ == '__main__':
    extract_pages([13, 14])
