import React, { useState, useEffect, createContext, useContext } from 'react';

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
// DADOS MOCKADOS
// ============================================================================
const mockProperties = [
  {
    id: '1',
    title: 'Casa de Praia em Copacabana',
    description: 'Linda casa com vista para o mar, 3 quartos e 2 banheiros',
    address: 'Rua Atlântica, 1500 - Copacabana, Rio de Janeiro',
    pricePerNight: 350.00,
    bedrooms: 3,
    bathrooms: 2,
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    title: 'Apartamento Moderno em Ipanema',
    description: 'Apartamento renovado no coração de Ipanema, ideal para casais',
    address: 'Rua Visconde de Pirajá, 800 - Ipanema, Rio de Janeiro',
    pricePerNight: 280.00,
    bedrooms: 2,
    bathrooms: 1,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    title: 'Cobertura com Piscina na Barra',
    description: 'Cobertura luxuosa com piscina privativa e vista panorâmica',
    address: 'Av. das Américas, 3000 - Barra da Tijuca, Rio de Janeiro',
    pricePerNight: 500.00,
    bedrooms: 4,
    bathrooms: 3,
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop'
  }
];

// ============================================================================
// FUNÇÕES DE API (SIMULADAS)
// ============================================================================
const apiService = {
  // Simula login na API
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 6) {
          resolve({
            access_token: 'fake-jwt-token-' + Date.now(),
            user: { email }
          });
        } else {
          reject(new Error('Credenciais inválidas'));
        }
      }, 1000); // Simula delay de rede
    });
  },

  // Simula buscar propriedades do usuário
  getProperties: async (token) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockProperties);
      }, 500);
    });
  },

  // Simula criar um bloqueio
  createBooking: async (propertyId, bookingData, token) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          propertyId,
          ...bookingData,
          status: 'confirmed'
        });
      }, 800);
    });
  }
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
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Rentals Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para gerenciar suas propriedades
          </p>
        </div>

        {/* Formulário de Login */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Dica para demo */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Para demo: use qualquer email válido e senha com 6+ caracteres
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: CARTÃO DE PROPRIEDADE
// ============================================================================
const PropertyCard = ({ property, onCreateBooking }) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    type: 'BLOCKED'
  });
  const [loading, setLoading] = useState(false);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onCreateBooking(property.id, bookingData);
      setShowBookingForm(false);
      setBookingData({ startDate: '', endDate: '', type: 'BLOCKED' });
    } catch (err) {
      console.error('Erro ao criar bloqueio:', err);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
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
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Criar Bloqueio
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

        {/* Formulário de Bloqueio */}
        {showBookingForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Criar Bloqueio</h4>
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
                  onClick={() => setShowBookingForm(false)}
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
// COMPONENTE: PÁGINA DO DASHBOARD
// ============================================================================
const DashboardPage = ({ user, onLogout }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

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
      // Aqui você poderia recarregar as propriedades ou mostrar uma notificação
      console.log('Bloqueio criado com sucesso!');
    } catch (err) {
      console.error('Erro ao criar bloqueio:', err);
      throw err;
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
              <p className="text-sm text-gray-600">Bem-vindo, {user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sair
            </button>
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
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0v-5a2 2 0 00-2-2H8a2 2 0 00-2 2v5m10 0v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma propriedade encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">Comece adicionando uma nova propriedade.</p>
                </div>
              )}
            </div>
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

  // Verifica se há token salvo no localStorage ao inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setPage('dashboard');
    }
  }, []);

  // Função para fazer login
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
      throw error; // Re-throw para que o LoginPage possa tratar
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
        {page === 'login' && (
          <LoginPage onLogin={handleLogin} />
        )}
        
        {page === 'dashboard' && user && (
          <DashboardPage user={user} onLogout={handleLogout} />
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default App;
