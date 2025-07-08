// frontend/src/components/messaging/PolicyWarning.tsx
import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface PolicyWarningProps {
  violations: Array<{
    type: string;
    severity: string;
    education: string;
  }>;
  onAccept: () => void;
  onRevise: () => void;
}

export default function PolicyWarning({ violations, onAccept, onRevise }: PolicyWarningProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': 
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600'
        };
      case 'high': 
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-600'
        };
      case 'medium': 
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600'
        };
      default: 
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        };
    }
  };

  const hasCriticalViolations = violations.some(v => v.severity === 'critical');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-primary-600 mr-3" />
          <h3 className="text-lg font-semibold">Platform Safety Notice</h3>
        </div>
        
        <div className="space-y-3 mb-6">
          <p className="text-neutral-700">
            We noticed your message might violate our platform policies. 
            Here's why these rules help keep you safe:
          </p>
          
          {violations.map((violation, index) => {
            const colors = getSeverityColor(violation.severity);
            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}
              >
                <div className="flex items-start">
                  <ExclamationTriangleIcon 
                    className={`h-5 w-5 ${colors.icon} mr-2 mt-0.5 flex-shrink-0`} 
                  />
                  <p className={`text-sm ${colors.text}`}>{violation.education}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Why use platform messaging?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your conversations are recorded for dispute resolution</li>
            <li>• Payment protection for deposits and rent</li>
            <li>• Verified user identities</li>
            <li>• 24/7 support if issues arise</li>
            <li>• Scam prevention and fraud protection</li>
          </ul>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onRevise}
            className="flex-1 btn-primary"
          >
            Revise Message
          </button>
          {!hasCriticalViolations && (
            <button
              onClick={onAccept}
              className="flex-1 btn-secondary"
            >
              I Understand, Send Anyway
            </button>
          )}
        </div>
        
        {hasCriticalViolations && (
          <p className="mt-4 text-sm text-red-600 text-center">
            Messages with critical violations cannot be sent.
          </p>
        )}
      </div>
    </div>
  );
}

// frontend/src/constants/messageTemplates.ts
export const MESSAGE_TEMPLATES = {
  initial_inquiry: {
    title: 'Initial Property Inquiry',
    content: `Hi! I'm interested in your property "{property_title}". 

I'm looking to move in around {move_in_date} for a duration of {duration}. The accommodation would be for {occupants} person(s).

Could you please tell me more about:
- The neighborhood and nearby amenities
- What utilities are included in the rent
- Any specific house rules or requirements

Looking forward to hearing from you!`,
    variables: ['property_title', 'move_in_date', 'duration', 'occupants']
  },
  
  schedule_viewing: {
    title: 'Schedule a Viewing',
    content: `Hello! I'm very interested in viewing "{property_title}".

I would like to schedule a viewing. I'm available on {move_in_date} or we can arrange another time that works for both of us.

Would it be possible to see the property this week? I'm flexible with timings.

Thank you!`,
    variables: ['property_title', 'move_in_date']
  },
  
  ask_amenities: {
    title: 'Ask About Amenities',
    content: `Hi! I'm interested in "{property_title}" and would like to know more about the amenities.

Specifically, I'd like to know about:
- Internet connection speed and reliability
- Laundry facilities
- Kitchen appliances and cookware
- Air conditioning/heating
- Parking availability
- Security features

Thank you for your time!`,
    variables: ['property_title']
  },
  
  ask_availability: {
    title: 'Check Availability',
    content: `Hello! I'm interested in "{property_title}".

Is the property still available for rent starting from {move_in_date}? I'm looking for a {duration} lease.

If it's available, I'd love to learn more about the application process.

Best regards!`,
    variables: ['property_title', 'move_in_date', 'duration']
  },
  
  ask_requirements: {
    title: 'Ask About Requirements',
    content: `Hi! I'm very interested in renting "{property_title}".

Could you please let me know:
- What documents are required for the application?
- Is there a security deposit? If so, how much?
- Do you require a guarantor?
- Are there any specific tenant requirements?

I'm a responsible tenant and can provide references if needed.

Thank you!`,
    variables: ['property_title']
  },
  
  ask_neighborhood: {
    title: 'Ask About the Neighborhood',
    content: `Hello! "{property_title}" looks great and I'd like to know more about the area.

Could you tell me about:
- Safety of the neighborhood
- Public transportation options
- Nearby grocery stores and restaurants
- Distance to universities
- The general vibe of the area

This information would really help me make a decision. Thanks!`,
    variables: ['property_title']
  }
};

// Spanish translations (for Mexico market)
export const MESSAGE_TEMPLATES_ES = {
  initial_inquiry: {
    title: 'Consulta Inicial de Propiedad',
    content: `¡Hola! Estoy interesado/a en tu propiedad "{property_title}".

Busco mudarme alrededor del {move_in_date} por una duración de {duration}. El alojamiento sería para {occupants} persona(s).

¿Podrías decirme más sobre:
- El vecindario y las comodidades cercanas
- Qué servicios están incluidos en la renta
- Reglas específicas de la casa o requisitos

¡Espero tu respuesta!`,
    variables: ['property_title', 'move_in_date', 'duration', 'occupants']
  },
  // ... más traducciones
};

// frontend/src/lib/api.ts - Add new messaging endpoints
// Add this to your existing apiService object

messaging: {
  // ... existing methods ...
  
  startPropertyConversation: (data: {
    userId: number;
    propertyId: number;
    message: string;
    templateType?: string;
    metadata?: any;
  }) => {
    return axios.post('/messages/conversations/start/', {
      user_id: data.userId,
      property_id: data.propertyId,
      message: data.message,
      template_type: data.templateType,
      metadata: data.metadata
    });
  },

  getMessageTemplates: (params?: { type?: string; propertyType?: string }) => {
    return axios.get('/messages/templates/', { params });
  },

  flagConversation: (conversationId: number, data: {
    reason: string;
    description?: string;
    messageId?: number;
  }) => {
    return axios.post(`/messages/conversations/${conversationId}/flag/`, {
      reason: data.reason,
      description: data.description,
      message_id: data.messageId
    });
  },

  markConversationRead: (conversationId: number) => {
    return axios.post(`/messages/conversations/${conversationId}/mark_read/`);
  },

  getConversationStats: (conversationId: number) => {
    return axios.get(`/messages/conversations/${conversationId}/stats/`);
  },
}