import json
import struct

def get_bounding_box(filepath):
    try:
        with open(filepath, 'rb') as f:
            magic = f.read(4)
            version = struct.unpack('<I', f.read(4))[0]
            length = struct.unpack('<I', f.read(4))[0]
            
            chunk0_len = struct.unpack('<I', f.read(4))[0]
            chunk0_type = f.read(4)
            
            json_data = f.read(chunk0_len).decode('utf-8')
            gltf = json.loads(json_data)
            
            accessors = gltf.get('accessors', [])
            for i, acc in enumerate(accessors):
                if acc.get('type') == 'VEC3':
                    print(f"Accessor {i}: min={acc.get('min')}, max={acc.get('max')}")
    except Exception as e:
        print(f'Error reading GLB: {e}')

get_bounding_box('public/human_anatomy.glb')
