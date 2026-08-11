import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Revert case-insensitive replacements from powershell
    content = content.replace('customerid', 'customerId')
    content = content.replace('productid', 'productId')

    # Fix Number() parsing
    content = content.replace('Number(id)', 'id')
    content = content.replace('Number(id!)', 'id!')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))
