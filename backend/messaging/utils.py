# backend/messaging/utils.py
def snake_to_camel_case(data):
    """Convert snake_case keys to camelCase recursively."""
    if isinstance(data, dict):
        return {
            to_camel_case(key): snake_to_camel_case(value)
            for key, value in data.items()
        }
    elif isinstance(data, list):
        return [snake_to_camel_case(item) for item in data]
    else:
        return data

def to_camel_case(snake_str):
    """Convert snake_case string to camelCase."""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])
