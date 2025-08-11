def find_properties_near_university(university_id, max_distance_km=2):
    """Find properties within max_distance_km of the university"""
    from properties.models import Property
    from universities.models import University
    
    try:
        university = University.objects.get(id=university_id)
    except University.DoesNotExist:
        return []
    
    # Get all properties
    all_properties = Property.objects.all()
    
    # Filter properties by distance
    nearby_properties = []
    for property in all_properties:
        if not property.latitude or not property.longitude:
            continue
            
        distance = university.distance_to(property.latitude, property.longitude)
        if distance <= max_distance_km:
            property.distance = distance  # Add distance as an attribute
            nearby_properties.append(property)
    
    # Sort by distance
    nearby_properties.sort(key=lambda x: x.distance)
    
    return nearby_properties
