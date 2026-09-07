import re
import subprocess
import os
import sys

def build_polished_html(md_text):
    css = """
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 13px;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    .header-card {
      background: linear-gradient(135deg, #0b1f3a 0%, #1e3a8a 100%);
      color: #ffffff;
      padding: 24px 26px;
      border-radius: 10px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .header-card h1 {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 6px 0;
      letter-spacing: -0.3px;
      color: #ffffff;
    }

    .header-card .subtitle {
      font-size: 14.5px;
      font-weight: 600;
      color: #93c5fd;
      margin: 0 0 16px 0;
    }

    .badge-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .meta-pill {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 12px;
      color: #f1f5f9;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .meta-pill.highlight {
      background: #f59e0b;
      border-color: #d97706;
      color: #000000;
      font-weight: 800;
    }

    .meta-pill strong {
      color: #ffffff;
    }
    .meta-pill.highlight strong {
      color: #000000;
    }

    h2 {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 24px 0 12px 0;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    h3 {
      font-size: 13.5px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 16px 0 8px 0;
    }

    p {
      margin: 0 0 10px 0;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 22px;
      color: #334155;
    }

    li {
      margin-bottom: 5px;
    }

    strong {
      color: #0f172a;
    }

    /* Enterprise Table Styling */
    .table-wrapper {
      margin: 14px 0 18px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      background-color: #ffffff;
    }

    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      border: none;
      letter-spacing: 0.2px;
    }

    td {
      padding: 9px 14px;
      border-top: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: middle;
      line-height: 1.45;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Alert / Enterprise Note Box */
    .alert-box {
      margin: 16px 0;
      padding: 12px 16px;
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      color: #166534;
      font-size: 12.5px;
      page-break-inside: avoid;
    }

    .alert-box strong {
      color: #14532d;
    }

    /* Architecture / ASCII Code card */
    .code-card {
      background-color: #0f172a;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 14px 0 18px 0;
      border: 1px solid #334155;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    pre {
      margin: 0;
      color: #f1f5f9;
      font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 10.5px;
      line-height: 1.35;
      overflow-x: auto;
      white-space: pre;
    }

    code {
      font-family: "Cascadia Code", Consolas, monospace;
      font-size: 11.5px;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background: none;
      border: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 22px 0;
    }

    .avoid-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .doc-footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: #64748b;
      page-break-inside: avoid;
    }
    """

    def format_inline(text):
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
        return text

    def escape_html(text):
        return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>System Concurrency, Capacity & Performance Specification</title>
<style>{css}</style>
</head>
<body>
"""

    lines = md_text.split('\n')
    i = 0
    in_list = None # 'ul' or 'ol'
    in_table = False
    table_rows = []
    in_code = False
    code_lines = []
    in_quote = False
    quote_lines = []

    def close_list():
        nonlocal in_list
        res = ""
        if in_list:
            res = f"</{in_list}>\n"
            in_list = None
        return res

    def close_table():
        nonlocal in_table, table_rows
        if not in_table or not table_rows:
            in_table = False
            return ""
        
        out = '<div class="table-wrapper"><table>\n'
        for idx, row in enumerate(table_rows):
            cells = [c.strip() for c in row.split('|')[1:-1]]
            if idx == 0:
                out += '  <thead>\n    <tr>\n'
                for c in cells:
                    out += f'      <th>{format_inline(c)}</th>\n'
                out += '    </tr>\n  </thead>\n  <tbody>\n'
            elif idx == 1 and all(set(c).issubset({'-', ':', ' '}) for c in cells):
                continue
            else:
                out += '    <tr>\n'
                for c in cells:
                    out += f'      <td>{format_inline(c)}</td>\n'
                out += '    </tr>\n'
        out += '  </tbody>\n</table></div>\n'
        table_rows = []
        in_table = False
        return out

    def close_code():
        nonlocal in_code, code_lines
        if not in_code:
            return ""
        code_str = "\n".join(code_lines)
        code_lines = []
        in_code = False
        return f'<div class="code-card"><pre><code>{escape_html(code_str)}</code></pre></div>\n'

    def close_quote():
        nonlocal in_quote, quote_lines
        if not in_quote:
            return ""
        content = "<br>".join([format_inline(l) for l in quote_lines if l.strip()])
        quote_lines = []
        in_quote = False
        return f'<div class="alert-box">{content}</div>\n'

    while i < len(lines):
        line = lines[i]

        # Code block delimiter
        if line.startswith('```'):
            html += close_list()
            html += close_table()
            html += close_quote()
            if in_code:
                html += close_code()
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        # Blockquote
        if line.startswith('>'):
            html += close_list()
            html += close_table()
            in_quote = True
            quote_lines.append(line.lstrip('> ').strip())
            i += 1
            continue
        elif in_quote:
            html += close_quote()

        # Tables
        if '|' in line and (line.strip().startswith('|') or line.strip().endswith('|')):
            html += close_list()
            if not in_table:
                in_table = True
                table_rows = []
            table_rows.append(line)
            i += 1
            continue
        elif in_table:
            html += close_table()

        # Document Header Card (H1 + H2 + metadata)
        if line.startswith('# '):
            html += close_list()
            title = line[2:].strip()
            subtitle = ""
            infra = "Virtual Private Server (VPS) — 4 vCPU Cores & 16 GB RAM"
            concurrency = "5,000 – 5,500 Parallel Active Students"

            i += 1
            while i < len(lines) and not lines[i].startswith('---') and not lines[i].startswith('## '):
                sub_l = lines[i].strip()
                if sub_l.startswith('## '):
                    subtitle = sub_l[3:].strip()
                elif '**Target Infrastructure:**' in sub_l:
                    infra = sub_l.split('**Target Infrastructure:**')[1].strip()
                elif '**Tested Safe Concurrency:**' in sub_l or '**Certified Safe Concurrency:**' in sub_l:
                    concurrency = sub_l.split('**')[2].strip().replace(':', '').strip() if len(sub_l.split('**')) > 2 else sub_l
                i += 1

            html += f"""
<div class="header-card">
  <h1>{format_inline(title)}</h1>
  {f'<div class="subtitle">{format_inline(subtitle)}</div>' if subtitle else ''}
  <div class="badge-container">
    <div class="meta-pill"><strong>Target Infrastructure:</strong> {format_inline(infra)}</div>
    <div class="meta-pill highlight"><strong>Tested Safe Concurrency:</strong> {format_inline(concurrency)}</div>
  </div>
</div>
"""
            continue

        # Section Headings
        if line.startswith('## '):
            html += close_list()
            html += f'<h2>{format_inline(line[3:].strip())}</h2>\n'
            i += 1
            continue

        if line.startswith('### '):
            html += close_list()
            html += f'<h3>{format_inline(line[4:].strip())}</h3>\n'
            i += 1
            continue

        if line.startswith('---'):
            html += close_list()
            html += '<hr>\n'
            i += 1
            continue

        # Bullet lists
        if line.startswith('* ') or line.startswith('- '):
            if in_list != 'ul':
                html += close_list()
                in_list = 'ul'
                html += '<ul>\n'
            html += f'  <li>{format_inline(line[2:].strip())}</li>\n'
            i += 1
            continue

        # Numbered lists
        if re.match(r'^\d+\.\s', line):
            if in_list != 'ol':
                html += close_list()
                in_list = 'ol'
                html += '<ol>\n'
            item_text = re.sub(r'^\d+\.\s', '', line).strip()
            html += f'  <li>{format_inline(item_text)}</li>\n'
            i += 1
            continue

        # Normal text paragraph
        stripped = line.strip()
        if stripped:
            html += close_list()
            html += f'<p>{format_inline(stripped)}</p>\n'

        i += 1

    html += close_list()
    html += close_table()
    html += close_code()
    html += close_quote()

    html += """
<div class="doc-footer">
  <span>Online School Examination Management System &bull; Capacity & Performance Specification</span>
  <span>Target Infrastructure: 4 vCPU / 16 GB RAM VPS</span>
</div>
</body>
</html>
"""
    return html

def main():
    md_path = r"c:\Users\Admin\Downloads\onlineexamsystem\CLIENT_CONCURRENCY_AND_CAPACITY_SPECIFICATION.md"
    html_path = r"c:\Users\Admin\Downloads\onlineexamsystem\CLIENT_CONCURRENCY_AND_CAPACITY_SPECIFICATION.html"
    pdf_path = r"c:\Users\Admin\Downloads\onlineexamsystem\CLIENT_CONCURRENCY_AND_CAPACITY_SPECIFICATION.pdf"

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    html_text = build_polished_html(md_text)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_text)

    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        f"file:///{html_path.replace(os.sep, '/')}"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and os.path.exists(pdf_path):
        print(f"Generated PDF at: {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")

if __name__ == "__main__":
    main()
