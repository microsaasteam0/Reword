import os
import re

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'datetime.now(timezone.utc)' not in content:
        return False
        
    print(f"Fixing {path}")
    new_content = content.replace('datetime.now(timezone.utc)', 'datetime.now(timezone.utc)')
    
    # Update imports
    if 'from datetime import datetime, timedelta' in new_content and 'timezone' not in new_content:
        new_content = new_content.replace('from datetime import datetime, timedelta', 'from datetime import datetime, timedelta, timezone')
    elif 'from datetime import datetime' in new_content and 'timezone' not in new_content:
        new_content = new_content.replace('from datetime import datetime', 'from datetime import datetime, timezone')
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True

root = 'e:\\Hairscope\\Work-Entrext\\SnippetStream\\backend'
for dirpath, dirnames, filenames in os.walk(root):
    for f in filenames:
        if f.endswith('.py'):
            fix_file(os.path.join(dirpath, f))
