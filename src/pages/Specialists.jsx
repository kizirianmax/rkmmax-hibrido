import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpecialistVisibility } from '../hooks/useSpecialistVisibility.js';
import { specialists, categories, getTotalSpecialists } from '../config/specialists.js';
import { canUseSpecialist } from '../config/fairUse.js';

function Specialists() {
  const navigate = useNavigate();
  const { isVisible } = useSpecialistVisibility();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock: usuário atual (substituir por contexto real)
  const userPlan = 'premium'; // ou 'basic', 'intermediate', 'free'
  
  // Filtrar especialistas
  const filteredSpecialists = Object.values(specialists).filter((specialist) => {
    const matchesCategory = selectedCategory === 'all' || specialist.category === selectedCategory;
    const matchesSearch = specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         specialist.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = isVisible(specialist.id);
    return matchesCategory && matchesSearch && matchesVisibility;
  });
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3e8ff 0%, #fff 50%, #dbeafe 100%)', padding: '48px 16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(90deg, #9333ea, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            {getTotalSpecialists()}+ Especialistas
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}>
            Serginho orquestra todos os especialistas para resolver qualquer desafio. 
            Escolha um especialista ou deixe o Serginho decidir automaticamente.
          </p>
        </div>
        
        {/* Search and Filter */}
        <div style={{ marginBottom: '24px' }}>
          {/* Search Bar */}
          <div style={{ maxWidth: '500px', margin: '0 auto 16px' }}>
            <input
              type="text"
              placeholder="Buscar especialista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          
          {/* Category Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', padding: '0 8px' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: selectedCategory === 'all' ? '#9333ea' : '#fff',
                color: selectedCategory === 'all' ? '#fff' : '#374151',
                boxShadow: selectedCategory === 'all' ? '0 4px 6px rgba(147, 51, 234, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              ✨ Todos
            </button>
            {Object.values(categories).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: selectedCategory === category.id ? 'none' : '1px solid #e5e7eb',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: selectedCategory === category.id ? '#9333ea' : '#fff',
                  color: selectedCategory === category.id ? '#fff' : '#374151',
                  boxShadow: selectedCategory === category.id ? '0 4px 6px rgba(147, 51, 234, 0.3)' : 'none',
                }}
              >
                {category.emoji} {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Specialists Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredSpecialists.map((specialist) => {
            const isAvailable = canUseSpecialist(userPlan, specialist.id);
            
            return (
              <div
                key={specialist.id}
                onClick={() => isAvailable && navigate(`/specialist/${specialist.id}`)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                  cursor: isAvailable ? 'pointer' : 'default',
                  opacity: isAvailable ? 1 : 0.6,
                  transition: 'all 0.2s',
                }}
              >
                {/* Header do Card */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <img 
                    src={`${specialist.avatar || `/avatars/${specialist.id}.png`}?v=2`} 
                    alt={specialist.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                    }}
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex'; 
                    }}
                  />
                  <div 
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f3e8ff, #dbeafe)',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0,
                    }}
                  >
                    {specialist.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '4px' }}>
                      {specialist.name}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {categories[specialist.category]?.emoji} {categories[specialist.category]?.name}
                    </span>
                  </div>
                  {!isAvailable && (
                    <span style={{
                      padding: '4px 8px',
                      background: '#f3e8ff',
                      color: '#9333ea',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      borderRadius: '999px',
                    }}>
                      Premium
                    </span>
                  )}
                </div>
                
                {/* Descrição */}
                <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '12px', lineHeight: 1.4 }}>
                  {specialist.description}
                </p>
                
                {/* Botão */}
                <button
                  disabled={!isAvailable}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAvailable) navigate(`/specialist/${specialist.id}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    background: isAvailable ? 'linear-gradient(90deg, #9333ea, #2563eb)' : '#e5e7eb',
                    color: isAvailable ? '#fff' : '#9ca3af',
                  }}
                >
                  {isAvailable ? '💬 Conversar' : '🔒 Premium'}
                </button>
              </div>
            );
          })}
        </div>
        
        {/* Empty State */}
        {filteredSpecialists.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Nenhum especialista encontrado. Tente outra busca!
            </p>
          </div>
        )}
        
        {/* CTA */}
        <div style={{ marginTop: '48px', textAlign: 'center', background: 'linear-gradient(90deg, #9333ea, #2563eb)', borderRadius: '24px', padding: '32px 24px', color: '#fff' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>
            Não sabe qual especialista escolher?
          </h2>
          <p style={{ fontSize: '1rem', marginBottom: '20px', opacity: 0.9 }}>
            Deixe o Serginho analisar sua tarefa e escolher automaticamente!
          </p>
          <button 
            onClick={() => navigate('/serginho')}
            style={{
              padding: '12px 24px',
              background: '#fff',
              color: '#9333ea',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Falar com o Serginho 🤖
          </button>
        </div>
      </div>
    </div>
  );
}

export default Specialists;
