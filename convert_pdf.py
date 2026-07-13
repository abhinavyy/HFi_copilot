import os
import subprocess
import markdown

def main():
    md_path = os.path.abspath('report.md')
    html_path = os.path.abspath('report.html')
    pdf_path = os.path.abspath('report.pdf')

    print(f"Reading {md_path}...")
    if not os.path.exists(md_path):
        print(f"Error: {md_path} not found.")
        return

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    print("Converting Markdown to HTML...")
    # Convert using standard markdown extensions for tables and code blocks
    html_content = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])

    # CSS stylesheet for high-fidelity PDF print layout
    css = """
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    @page {
        size: A4;
        margin: 20mm;
    }
    
    body {
        font-family: 'Outfit', sans-serif;
        color: #1e293b;
        line-height: 1.6;
        font-size: 11pt;
        background: #ffffff;
    }
    
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Outfit', sans-serif;
        color: #0f172a;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        page-break-after: avoid;
        break-after: avoid;
    }
    
    h1 {
        font-size: 24pt;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.3em;
        margin-top: 0;
        page-break-before: always;
    }
    
    /* Suppress page break on the very first H1 */
    h1:first-of-type {
        page-break-before: avoid;
        margin-top: 0;
    }
    
    h2 {
        font-size: 18pt;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.2em;
        margin-top: 1.8em;
    }
    
    h3 {
        font-size: 14pt;
    }
    
    h4 {
        font-size: 12pt;
    }
    
    p {
        margin-top: 0;
        margin-bottom: 1em;
        text-align: justify;
    }
    
    a {
        color: #2563eb;
        text-decoration: none;
    }
    
    ul, ol {
        margin-top: 0;
        margin-bottom: 1em;
        padding-left: 20px;
    }
    
    li {
        margin-bottom: 0.5em;
    }
    
    code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9.5pt;
        background-color: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        color: #0f172a;
    }
    
    pre {
        font-family: 'JetBrains Mono', monospace;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        font-size: 9pt;
        overflow-x: auto;
        margin-top: 0;
        margin-bottom: 1.5em;
        white-space: pre-wrap;
        word-wrap: break-word;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    
    pre code {
        background-color: transparent;
        padding: 0;
        border-radius: 0;
        color: inherit;
        font-size: inherit;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0;
        margin-bottom: 1.5em;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    
    th, td {
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        font-size: 9.5pt;
        text-align: left;
    }
    
    th {
        background-color: #f8fafc;
        font-weight: 600;
        color: #0f172a;
    }
    
    tr:nth-child(even) {
        background-color: #f8fafc;
    }
    
    img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1.5em auto;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    
    blockquote {
        margin: 0 0 1.5em 0;
        padding: 10px 20px;
        background-color: #f8fafc;
        border-left: 4px solid #3b82f6;
        border-radius: 0 8px 8px 0;
        font-style: italic;
    }
    
    hr {
        border: 0;
        height: 1px;
        background: #e2e8f0;
        margin: 2em 0;
        page-break-after: always;
        break-after: page;
    }
    """

    full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>HobbyFi Copilot - Technical CRM Design Report</title>
    <style>
        {css}
    </style>
</head>
<body>
    <div class="report-content">
        {html_content}
    </div>
</body>
</html>
"""

    print(f"Writing temporary HTML file to {html_path}...")
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)

    # Edge location (Chromium engine)
    edge_executable = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_executable):
        print(f"Error: Microsoft Edge not found at {edge_executable}")
        return

    print("Executing Edge in Headless PDF Print Mode...")
    cmd = [
        edge_executable,
        "--headless",
        "--disable-gpu",
        f"--print-to-pdf={pdf_path}",
        "--no-margins",
        html_path
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Success! Generated: {pdf_path}")
        
        # Cleanup temporary HTML file
        if os.path.exists(html_path):
            os.remove(html_path)
            print("Cleaned up temporary HTML file.")
            
    except subprocess.CalledProcessError as e:
        print(f"Error executing Edge print: {e}")

if __name__ == '__main__':
    main()
