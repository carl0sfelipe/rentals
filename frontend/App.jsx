import React, { useState, useEffect, createContext, useContext } from 'react';
import ProfessionalAd from './src/components/ProfessionalAd';

// ============================================================================
// FEATURE FLAGS (CONFIGURAÇÃO ÚNICA)
// ============================================================================
// Estado da configuração
let MULTI_TENANT_ENABLED = false;
let CONFIG_LOADED = false;

// Função para carregar configuração do backend
const loadConfig = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/config/feature-flags`);
    if (response.ok) {
      const config = await response.json();
      MULTI_TENANT_ENABLED = config.MULTI_TENANT_ENABLED;
      CONFIG_LOADED = true;
      console.log('🚀 Configuração carregada:', { MULTI_TENANT_ENABLED });
      return true;
    }
  } catch (error) {
    console.warn('Erro ao carregar configuração, usando padrão');
    MULTI_TENANT_ENABLED = false;
    CONFIG_LOADED = true;
  }
  return false;
};

// ============================================================================
// CONTEXTO DE AUTENTICAÇÃO
// ============================================================================
const AuthContext = createContext();

// Hook customizado para usar o contexto de autenticação
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// ============================================================================
// UTILITÁRIOS E CONFIGURAÇÕES
// ============================================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================================
// FUNÇÕES DE API (CONECTADAS AO BACKEND REAL)
// ============================================================================

// Função para fazer requisições HTTP com interceptor de auth
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  // Adiciona Authorization header se token existir
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Se token expirou (401), limpa localStorage e redireciona para login
    if (response.status === 401 && token) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.reload(); // Força reload para voltar ao login
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// Função para verificar se o token está válido/não expirado
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Decodifica o JWT payload (parte do meio)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Verifica se não expirou
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const apiService = {
  // Conecta ao backend real para login
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Email ou senha incorretos');
        }
        throw new Error('Erro no servidor. Tente novamente.');
      }

      const data = await response.json();
      
      return {
        access_token: data.access_token,
        user: { email }
      };
    } catch (error) {
      // Se for erro de rede (servidor não responde)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique se o servidor está rodando.');
      }
      // Re-throw outros erros
      throw error;
    }
  },

  // Registra novo usuário
  register: async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error('Email já está em uso');
        }
        throw new Error(errorData.message || 'Erro ao criar conta');
      }

      const data = await response.json();
      
      return {
        access_token: data.access_token,
        user: { email, name }
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique se o servidor está rodando.');
      }
      throw error;
    }
  },

  // Busca propriedades do usuário autenticado
  getProperties: async (token) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar propriedades');
      }
      
      const properties = await response.json();
      return properties;
    } catch (error) {
      console.error('Erro ao buscar propriedades:', error);
      return [];
    }
  },

  // Cria um bloqueio/reserva na API
  createBooking: async (propertyId, bookingData, token) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          type: bookingData.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.message.includes('Conflito de datas')) {
          throw new Error(`CONFLICT: ${errorData.message}`);
        }
        throw new Error('Erro ao criar bloqueio');
      }

      const booking = await response.json();
      return booking;
    } catch (error) {
      console.error('Erro ao criar booking:', error);
      throw error;
    }
  },

  // Busca bookings de uma propriedade
  getBookings: async (propertyId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/bookings`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar bookings');
      }
      
      const bookings = await response.json();
      return bookings;
    } catch (error) {
      console.error('Erro ao buscar bookings:', error);
      return [];
    }
  },

  // Atualiza um booking
  updateBooking: async (propertyId, bookingId, bookingData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          type: bookingData.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.message.includes('Conflito de datas')) {
          throw new Error(`CONFLICT: ${errorData.message}`);
        }
        throw new Error('Erro ao atualizar booking');
      }

      const booking = await response.json();
      return booking;
    } catch (error) {
      console.error('Erro ao atualizar booking:', error);
      throw error;
    }
  },

  // Deleta um booking
  deleteBooking: async (propertyId, bookingId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar booking');
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar booking:', error);
      throw error;
    }
  },

  // Cria uma nova propriedade
  createProperty: async (propertyData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties`, {
        method: 'POST',
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar propriedade');
      }

      const property = await response.json();
      return property;
    } catch (error) {
      console.error('Erro ao criar propriedade:', error);
      throw error;
    }
  },

  // Atualiza uma propriedade existente
  updateProperty: async (propertyId, propertyData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'PATCH',
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar propriedade');
      }

      const property = await response.json();
      return property;
    } catch (error) {
      console.error('Erro ao atualizar propriedade:', error);
      throw error;
    }
  },

  // Deleta uma propriedade
  deleteProperty: async (propertyId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar propriedade');
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar propriedade:', error);
      throw error;
    }
  },

  // === FUNÇÕES DE MEMBROS DA ORGANIZAÇÃO ===

  // Lista membros da organização
  getMembers: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/organizations/members`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar membros');
      }
      
      const members = await response.json();
      return members;
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      return [];
    }
  },

  // Adiciona um membro à organização
  addMember: async (email, role) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/organizations/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar membro');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  },

  // Remove um membro da organização
  removeMember: async (userId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/organizations/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao remover membro');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  },

  // Atualiza role de um membro
  updateMemberRole: async (userId, role) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/organizations/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar função');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      throw error;
    }
  },

  // Lista organizações do usuário
  getMyOrganizations: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/organizations/members/my-organizations`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar organizações');
      }
      
      const organizations = await response.json();
      return organizations;
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      return [];
    }
  },

  // Troca de organização ativa
  switchOrganization: async (organizationId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/organizations/members/switch/${organizationId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao trocar organização');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao trocar organização:', error);
      throw error;
    }
  }
};

// ============================================================================
// COMPONENTE: LISTA DE BOOKINGS
// ============================================================================
const BookingsList = ({ propertyId }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editError, setEditError] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'BLOCKED'
  });

  // Carrega bookings ao montar
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const bookingsData = await apiService.getBookings(propertyId);
        setBookings(bookingsData);
      } catch (err) {
        console.error('Erro ao carregar bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [propertyId]);

  // Formata data para exibição
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Verifica se há conflito entre duas datas
  const hasDateConflict = (booking1, booking2) => {
    const start1 = new Date(booking1.startDate);
    const end1 = new Date(booking1.endDate);
    const start2 = new Date(booking2.startDate);
    const end2 = new Date(booking2.endDate);

    return (start1 < end2 && start2 < end1);
  };

  // Encontra conflitos para um booking específico
  const getConflictingBookings = (currentBooking) => {
    return bookings.filter(booking => 
      booking.id !== currentBooking.id && hasDateConflict(currentBooking, booking)
    );
  };

  // Handle editar booking
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setEditError('');
    setFormData({
      startDate: booking.startDate.split('T')[0],
      endDate: booking.endDate.split('T')[0],
      type: booking.type
    });
  };

  // Handle salvar edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEditError('');

    try {
      const updatedBooking = await apiService.updateBooking(propertyId, editingBooking.id, formData);
      setBookings(bookings.map(b => b.id === editingBooking.id ? updatedBooking : b));
      setEditingBooking(null);
      alert('✅ Booking atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar booking:', err);
      
      if (err.message.startsWith('CONFLICT:')) {
        const conflictMessage = err.message.replace('CONFLICT: ', '');
        setEditError(conflictMessage);
      } else {
        setEditError('Erro ao atualizar booking. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle deletar booking
  const handleDeleteBooking = async (bookingId) => {
    if (!confirm('Tem certeza que deseja excluir este bloqueio?')) {
      return;
    }

    try {
      await apiService.deleteBooking(propertyId, bookingId);
      setBookings(bookings.filter(b => b.id !== bookingId));
      alert('✅ Booking excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao deletar booking:', err);
      alert('❌ Erro ao excluir booking.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {bookings.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum bloqueio encontrado</h4>
          <p className="text-gray-600">Esta propriedade não possui bloqueios ou reservas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const conflicts = getConflictingBookings(booking);
            const hasConflicts = conflicts.length > 0;
            
            return (
              <div key={booking.id} className={`border rounded-lg p-4 ${
                hasConflicts ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}>
                {/* Aviso de conflito */}
                {hasConflicts && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm text-red-800 font-medium">
                        ⚠️ Conflito detectado com: {conflicts.map(c => `${formatDate(c.startDate)}-${formatDate(c.endDate)}`).join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {editingBooking?.id === booking.id ? (
                // Formulário de edição
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  {/* Mensagem de erro de edição */}
                  {editError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <h5 className="text-sm font-medium text-red-800 mb-1">Conflito de Datas</h5>
                          <p className="text-sm text-red-700">{editError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Início
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Fim
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="BLOCKED">Bloqueado</option>
                        <option value="RESERVATION">Reserva</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBooking(null);
                        setEditError('');
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                // Visualização normal
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Criado em {formatDate(booking.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.type === 'BLOCKED' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.type === 'BLOCKED' ? 'Bloqueado' : 'Reserva'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: FORMULÁRIO DE PROPRIEDADE
// ============================================================================
const PropertyForm = ({ property, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    address: property?.address || '',
    pricePerNight: property?.pricePerNight || '',
    bedrooms: property?.bedrooms || '',
    bathrooms: property?.bathrooms || '',
    imageUrl: property?.imageUrl || '',
  });

  const [imagePreview, setImagePreview] = useState(property?.imageUrl || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Converte valores numéricos
    const propertyData = {
      ...formData,
      pricePerNight: parseFloat(formData.pricePerNight),
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
    };

    await onSave(propertyData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Atualizar preview da imagem quando URL da imagem mudar
    if (name === 'imageUrl') {
      setImagePreview(value);
    }
  };

  const generateRandomImage = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/unsplash/random`);
      const data = await response.json();
      setFormData({ ...formData, imageUrl: data.imageUrl });
      setImagePreview(data.imageUrl);
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      // Fallback para URL direta
      const fallbackUrl = `https://source.unsplash.com/800x600/?architecture,interior,home,apartment,house,modern&${Date.now()}`;
      setFormData({ ...formData, imageUrl: fallbackUrl });
      setImagePreview(fallbackUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {property ? 'Editar Propriedade' : 'Nova Propriedade'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Casa de Praia em Copacabana"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Descreva a propriedade..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Endereço completo"
              />
            </div>

            {/* Campo de Imagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da Imagem (opcional)
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  <button
                    type="button"
                    onClick={generateRandomImage}
                    className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    title="Gerar imagem aleatória"
                  >
                    🎲 Aleatória
                  </button>
                </div>
                
                {/* Preview da Imagem */}
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                    />
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Se não fornecida, uma imagem automática será gerada
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço/Noite
                </label>
                <input
                  type="number"
                  name="pricePerNight"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricePerNight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quartos
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  required
                  min="1"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banheiros
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  required
                  min="1"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: LOADING SPINNER
// ============================================================================
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// ============================================================================
// COMPONENTE: PÁGINA DE LOGIN
// ============================================================================
const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Registro
        const result = await apiService.register(formData.name, formData.email, formData.password);
        // Auto-login após registro
        localStorage.setItem('token', result.access_token);
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.reload();
      } else {
        // Login
        await onLogin(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message || (isRegister ? 'Erro ao criar conta' : 'Erro ao fazer login'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Rentals Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegister ? 'Crie sua conta para começar' : 'Faça login para gerenciar suas propriedades'}
          </p>
        </div>

        {/* Formulário de Login/Registro */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Campo Nome (apenas no registro) */}
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Seu nome completo"
                />
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Sua senha"
              />
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Botão de Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {isRegister ? 'Criando conta...' : 'Entrando...'}
                  </span>
                ) : (
                  isRegister ? 'Criar conta' : 'Entrar'
                )}
              </button>
            </div>

            {/* Toggle entre Login e Registro */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                {isRegister 
                  ? 'Já tem uma conta? Faça login' 
                  : 'Não tem conta? Registre-se'
                }
              </button>
            </div>
          </form>
        </div>

        {/* Dica para demo */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Conectado ao backend: {API_BASE_URL}<br/>
            <strong>Teste:</strong> admin@rentals.com / 12345678
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: CARTÃO DE PROPRIEDADE
// ============================================================================
const PropertyCard = ({ property, onCreateBooking, onEdit, onDelete, onViewProfessionalAd, showActions = false }) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showBookingsList, setShowBookingsList] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    type: 'BLOCKED'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onCreateBooking(property.id, bookingData);
      setShowBookingForm(false);
      setBookingData({ startDate: '', endDate: '', type: 'BLOCKED' });
    } catch (err) {
      console.error('Erro ao criar bloqueio:', err);
      
      if (err.message.startsWith('CONFLICT:')) {
        const conflictMessage = err.message.replace('CONFLICT: ', '');
        setError(conflictMessage);
      } else {
        setError('Erro ao criar bloqueio. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calendarUrl = `${window.location.origin}/api/properties/${property.id}/calendar.ics`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagem da Propriedade */}
      <div className="h-48 bg-gray-200 relative">
        <img
          src={property.imageUrl}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=Sem+Imagem';
          }}
        />
        <div className="absolute top-2 right-2">
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            R$ {property.pricePerNight}/noite
          </span>
        </div>
      </div>

      {/* Conteúdo do Cartão */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{property.description}</p>
        
        {/* Endereço */}
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{property.address}</span>
        </div>

        {/* Detalhes */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 15v-2a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            {property.bedrooms} quartos
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            {property.bathrooms} banheiros
          </span>
        </div>

        {/* Ações */}
        <div className="flex space-x-2 mb-3">
          {showActions && (
            <>
              <button
                onClick={() => onEdit(property)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(property.id)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Excluir
              </button>
            </>
          )}
        </div>

        <div className="flex space-x-2 mb-3">
          <button
            onClick={() => onViewProfessionalAd(property)}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            📄 Ver Anúncio Profissional
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Criar Bloqueio
          </button>
          <button
            onClick={() => setShowBookingsList(true)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Ver Bloqueios
          </button>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            title="Baixar calendário"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
            </svg>
          </a>
        </div>

        {/* Modal para ver e editar bloqueios */}
        {showBookingsList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Bloqueios da Propriedade</h3>
                <button
                  onClick={() => setShowBookingsList(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <BookingsList propertyId={property.id} />
            </div>
          </div>
        )}

        {/* Formulário de Bloqueio */}
        {showBookingForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Criar Bloqueio</h4>
            
            {/* Mensagem de erro */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h5 className="text-sm font-medium text-red-800 mb-1">Conflito de Datas Detectado</h5>
                    <p className="text-sm text-red-700">{error}</p>
                    <p className="text-xs text-red-600 mt-2">
                      💡 <strong>Dica:</strong> Clique em "Ver Bloqueios" para verificar os períodos já ocupados e editar se necessário.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingData.startDate}
                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingData.endDate}
                    onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={bookingData.type}
                  onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="BLOCKED">Bloqueado</option>
                  <option value="RESERVATION">Reserva</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: GERENCIAMENTO DE MEMBROS
// ============================================================================
const MembersManagement = ({ onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMemberData, setAddMemberData] = useState({ email: '', role: 'MEMBER' });
  const [addingMember, setAddingMember] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carrega membros
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const membersData = await apiService.getMembers();
        setMembers(membersData);
      } catch (err) {
        console.error('Erro ao carregar membros:', err);
        setError('Erro ao carregar membros');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  // Adicionar membro
  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiService.addMember(addMemberData.email, addMemberData.role);
      setSuccess(`${result.member.user.name} foi adicionado à organização!`);
      setAddMemberData({ email: '', role: 'MEMBER' });
      setShowAddForm(false);
      
      // Recarrega membros
      const membersData = await apiService.getMembers();
      setMembers(membersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  // Remover membro
  const handleRemoveMember = async (userId, userName) => {
    if (!confirm(`Tem certeza que deseja remover ${userName} da organização?`)) {
      return;
    }

    try {
      await apiService.removeMember(userId);
      setSuccess(`${userName} foi removido da organização`);
      
      // Remove da lista local
      setMembers(members.filter(m => m.user.id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Atualizar role
  const handleUpdateRole = async (userId, newRole, userName) => {
    try {
      await apiService.updateMemberRole(userId, newRole);
      setSuccess(`Função de ${userName} atualizada para ${newRole}`);
      
      // Atualiza na lista local
      setMembers(members.map(m => 
        m.user.id === userId ? { ...m, role: newRole } : m
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'PROPRIETARIO': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'MEMBER': return 'bg-green-100 text-green-800';
      case 'CLEANER': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'PROPRIETARIO': return 'Proprietário';
      case 'ADMIN': return 'Administrador';
      case 'MANAGER': return 'Gerente';
      case 'MEMBER': return 'Membro';
      case 'CLEANER': return 'Limpeza';
      default: return role;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">👥 Gerenciar Membros</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Botão Adicionar Membro */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            + Adicionar Membro
          </button>
        </div>

        {/* Formulário Adicionar Membro */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Adicionar Novo Membro</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email do Usuário
                </label>
                <input
                  type="email"
                  required
                  value={addMemberData.email}
                  onChange={(e) => setAddMemberData({ ...addMemberData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@exemplo.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O usuário deve já ter uma conta registrada
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <select
                  value={addMemberData.role}
                  onChange={(e) => setAddMemberData({ ...addMemberData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MEMBER">Membro</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="PROPRIETARIO">Proprietário</option>
                  <option value="CLEANER">Limpeza</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={addingMember}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {addingMember ? 'Adicionando...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Membros */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando membros...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.user.name}</h4>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                      <p className="text-xs text-gray-500">
                        Membro desde {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Badge da Função */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>

                    {/* Dropdown para alterar função */}
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user.id, e.target.value, member.user.name)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="MEMBER">Membro</option>
                      <option value="MANAGER">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="PROPRIETARIO">Proprietário</option>
                      <option value="CLEANER">Limpeza</option>
                    </select>

                    {/* Botão Remover */}
                    <button
                      onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum membro encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: PÁGINA DO DASHBOARD
// ============================================================================
const DashboardPage = ({ user, activeOrganizationId, onLogout }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showMembersManagement, setShowMembersManagement] = useState(false);
  const [showProfessionalAd, setShowProfessionalAd] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [multiTenantEnabled, setMultiTenantEnabled] = useState(false);
  const { token } = useAuth();

  // Carrega configuração multi-tenant
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/config/feature-flags`);
        if (response.ok) {
          const config = await response.json();
          setMultiTenantEnabled(config.MULTI_TENANT_ENABLED);
          console.log('🚀 Multi-tenant configurado:', config.MULTI_TENANT_ENABLED);
        }
      } catch (error) {
        console.warn('Erro ao carregar configuração multi-tenant');
        setMultiTenantEnabled(false);
      }
    };
    loadConfig();
  }, []);

  // Carrega propriedades ao montar o componente
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const propertiesData = await apiService.getProperties(token);
        setProperties(propertiesData);
      } catch (err) {
        console.error('Erro ao carregar propriedades:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [token]);

  // Handle criar bloqueio
  const handleCreateBooking = async (propertyId, bookingData) => {
    try {
      await apiService.createBooking(propertyId, bookingData, token);
      alert('✅ Bloqueio criado com sucesso!');
      console.log('Bloqueio criado com sucesso!');
    } catch (err) {
      console.error('Erro ao criar bloqueio:', err);
      
      // Se for erro de conflito, deixa o componente PropertyCard tratar a mensagem
      if (!err.message.startsWith('CONFLICT:')) {
        alert('❌ Erro ao criar bloqueio. Tente novamente.');
      }
      throw err;
    }
  };

  // Handle criar/editar propriedade
  const handleSaveProperty = async (propertyData) => {
    setFormLoading(true);
    try {
      if (editingProperty) {
        // Editar propriedade existente
        const updatedProperty = await apiService.updateProperty(editingProperty.id, propertyData, token);
        setProperties(props => props.map(p => p.id === editingProperty.id ? updatedProperty : p));
      } else {
        // Criar nova propriedade
        const newProperty = await apiService.createProperty(propertyData, token);
        setProperties(props => [...props, newProperty]);
      }
      
      setShowPropertyForm(false);
      setEditingProperty(null);
    } catch (err) {
      console.error('Erro ao salvar propriedade:', err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Handle editar propriedade
  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowPropertyForm(true);
  };

  // Handle excluir propriedade
  const handleDeleteProperty = async (propertyId) => {
    if (!confirm('Tem certeza que deseja excluir esta propriedade?')) {
      return;
    }

    try {
      await apiService.deleteProperty(propertyId, token);
      setProperties(props => props.filter(p => p.id !== propertyId));
    } catch (err) {
      console.error('Erro ao excluir propriedade:', err);
      alert('Erro ao excluir propriedade. Tente novamente.');
    }
  };

  // Handle cancelar formulário
  const handleCancelForm = () => {
    setShowPropertyForm(false);
    setEditingProperty(null);
  };

  // Handle ver anúncio profissional
  const handleViewProfessionalAd = (property) => {
    setSelectedProperty(property);
    setShowProfessionalAd(true);
  };

  // Handle anúncio público (para visitantes)
  const handlePublicAd = async (slug) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/properties/public/${slug}`);

      if (!response.ok) {
        throw new Error('Anúncio não encontrado');
      }

      const property = await response.json();
      setSelectedProperty(property);
      setShowProfessionalAd(true);
      setPage('public-ad'); // Novo estado para anúncios públicos
    } catch (error) {
      console.error('Erro ao carregar anúncio público:', error);
      alert('Anúncio não encontrado ou expirado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rentals Dashboard</h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">Bem-vindo, {user.email}</p>
                <div className="flex items-center text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Conectado
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {multiTenantEnabled && (
                <button
                  onClick={() => setShowMembersManagement(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  👥 Membros
                </button>
              )}
              <button
                onClick={() => setShowPropertyForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                + Nova Propriedade
              </button>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Título da Seção */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Minhas Propriedades</h2>
            <p className="text-gray-600">Gerencie suas propriedades e bloqueios</p>
          </div>

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Lista de Propriedades */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.length > 0 ? (
                properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onCreateBooking={handleCreateBooking}
                    onEdit={handleEditProperty}
                    onDelete={handleDeleteProperty}
                    onViewProfessionalAd={handleViewProfessionalAd}
                    showActions={true}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0v-5a2 2 0 00-2-2H8a2 2 0 00-2 2v5m10 0v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma propriedade encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">Comece adicionando uma nova propriedade.</p>
                  <button
                    onClick={() => setShowPropertyForm(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    + Adicionar Primeira Propriedade
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Formulário de Propriedade */}
          {showPropertyForm && (
            <PropertyForm
              property={editingProperty}
              onSave={handleSaveProperty}
              onCancel={handleCancelForm}
              loading={formLoading}
            />
          )}

          {/* Gerenciamento de Membros (Modal) */}
          {multiTenantEnabled && showMembersManagement && (
            <MembersManagement onClose={() => setShowMembersManagement(false)} />
          )}

          {/* Professional Ad Modal */}
          {showProfessionalAd && selectedProperty && (
            <ProfessionalAd
              property={selectedProperty}
              onClose={() => {
                setShowProfessionalAd(false);
                setSelectedProperty(null);
              }}
              isPreview={true}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: APP
// ============================================================================
const App = () => {
  // Estado de autenticação
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState('login');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showProfessionalAd, setShowProfessionalAd] = useState(false);

  // Handle anúncio público (para visitantes)
  const handlePublicAd = async (slug) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/properties/public/${slug}`);

      if (!response.ok) {
        throw new Error('Anúncio não encontrado');
      }

      const property = await response.json();
      setSelectedProperty(property);
      setShowProfessionalAd(true);
      setPage('public-ad'); // Novo estado para anúncios públicos
    } catch (error) {
      console.error('Erro ao carregar anúncio público:', error);
      alert('Anúncio não encontrado ou expirado');
    }
  };

  // Carrega configuração do backend
  useEffect(() => {
    const initializeConfig = async () => {
      await loadConfig();
      setConfigLoaded(true);
    };
    initializeConfig();
  }, []);

  // Verifica se há token salvo no localStorage ao inicializar
  useEffect(() => {
    if (!configLoaded) return; // Espera configuração carregar

    // Verifica se é um anúncio público (URL contém /public/)
    const path = window.location.pathname;
    if (path.startsWith('/public/')) {
      const slug = path.replace('/public/', '');
      if (slug) {
        // Carrega anúncio público
        handlePublicAd(slug);
        return;
      }
    }

    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');

    if (savedToken && savedUser) {
      // Verifica se o token ainda é válido
      if (isTokenValid(savedToken)) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setPage('dashboard');
      } else {
        // Token expirado - limpa storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setPage('login');
      }
    } else {
      setPage('login');
    }
  }, [configLoaded]);

  // Verifica periodicamente se o token ainda é válido (a cada 30 segundos)
  useEffect(() => {
    const checkTokenValidity = () => {
      const savedToken = localStorage.getItem('authToken');
      if (savedToken && !isTokenValid(savedToken)) {
        handleLogout();
      }
    };

    // Só configura o timer se estiver logado
    if (user && token) {
      const interval = setInterval(checkTokenValidity, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [user, token]);

  // Função para fazer login (agora totalmente async e conectada ao backend)
  const handleLogin = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      
      // Salva no estado
      setUser(response.user);
      setToken(response.access_token);
      
      // Salva no localStorage para persistência
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      
      // Muda para a página do dashboard
      setPage('dashboard');
    } catch (error) {
      throw error; // Re-throw para que o LoginPage possa tratar o erro
    }
  };

  // Função para fazer logout
  const handleLogout = () => {
    // Limpa o estado
    setUser(null);
    setToken(null);
    
    // Limpa o localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
    // Volta para a página de login
    setPage('login');
  };

  // Provê o contexto de autenticação para componentes filhos
  const authContextValue = {
    user,
    token,
    login: handleLogin,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="App">
        {/* Roteamento simples baseado em estado */}
        {/* Loading state enquanto configuração carrega */}
        {!configLoaded && (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando configuração...</p>
            </div>
          </div>
        )}

        {configLoaded && page === 'login' && (
          <LoginPage onLogin={handleLogin} />
        )}
        
        {configLoaded && page === 'dashboard' && user && (
          <DashboardPage user={user} onLogout={handleLogout} />
        )}

        {configLoaded && page === 'public-ad' && selectedProperty && (
          <ProfessionalAd
            property={selectedProperty}
            onClose={() => {
              setSelectedProperty(null);
              setPage('login');
            }}
            isPreview={false}
          />
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default App;
