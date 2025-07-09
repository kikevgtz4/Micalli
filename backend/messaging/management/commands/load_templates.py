from django.core.management.base import BaseCommand
from messaging.models import MessageTemplate

class Command(BaseCommand):
    help = 'Load message templates into database'

    def handle(self, *args, **options):
        templates = [
            {
                'template_type': 'initial_inquiry',
                'title': 'Initial Property Inquiry',
                'title_es': 'Consulta Inicial sobre la Propiedad',
                'content': '''Hi! I'm interested in your property "{property_title}". 

I'm looking to move in around {move_in_date} for a duration of {duration}. The accommodation would be for {occupants} person(s).

Could you please tell me more about:
- The neighborhood and nearby amenities
- What utilities are included in the rent
- Any specific house rules or requirements

Looking forward to hearing from you!''',
                'content_es': '''¡Hola! Estoy interesado/a en tu propiedad "{property_title}".

Busco mudarme alrededor del {move_in_date} por una duración de {duration}. El alojamiento sería para {occupants} persona(s).

¿Podrías decirme más sobre:
- El vecindario y las comodidades cercanas
- Qué servicios están incluidos en la renta
- Reglas específicas de la casa o requisitos

¡Espero tu respuesta!''',
                'variables': ['property_title', 'move_in_date', 'duration', 'occupants'],
                'order': 1
            },
            # Add other templates here...
        ]

        for template_data in templates:
            MessageTemplate.objects.update_or_create(
                template_type=template_data['template_type'],
                defaults=template_data
            )
            self.stdout.write(f"Loaded template: {template_data['template_type']}")

        self.stdout.write(self.style.SUCCESS('Successfully loaded all templates'))