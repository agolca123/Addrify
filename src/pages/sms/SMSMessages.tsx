import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Phone, ChevronDown, Search, Loader, AlertCircle, Inbox, Home, UserCircle, Send, Clock, CheckCheck, X, MessageSquare } from 'lucide-react';
import { sendSMS } from '../../services/smsService';

interface Resident {
  name: string;
  phones: string[];
  address: string;
  age_range?: string;
  gender?: string;
}

interface AddressGroup {
  address: string;
  residents: Array<Resident>;
}

interface SMSMessage {
  id?: string;
  user_id: string;
  phone_number: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'delivered' | 'failed' | 'pending';
  twilio_sid?: string;
  error_message?: string;
  metadata: {
    resident_name: string;
    address: string;
    age_range: string;
    gender: string;
  };
  created_at: string;
  updated_at: string;
  source?: 'reverse_address' | 'manual';
  address_info?: AddressGroup;
}

const formatMessageDate = (date: string) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return 'Bugün';
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Dün';
  } else {
    return messageDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
};

export const SMSMessages = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [addressGroups, setAddressGroups] = useState<Record<string, AddressGroup>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set());
  const [expandedResidents, setExpandedResidents] = useState<Set<string>>(new Set());
  const [newMessage, setNewMessage] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) {
      const sortedGroups = Object.entries(addressGroups)
        .sort((a, b) => {
          const aLatestMessage = messages
            .filter(m => m.metadata?.address === a[0])
            .sort((m1, m2) => new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime())[0];
          
          const bLatestMessage = messages
            .filter(m => m.metadata?.address === b[0])
            .sort((m1, m2) => new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime())[0];

          if (!aLatestMessage || !bLatestMessage) return 0;
          return new Date(bLatestMessage.created_at).getTime() - new Date(aLatestMessage.created_at).getTime();
        })
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, AddressGroup>);

      return sortedGroups;
    }

    const filtered: Record<string, AddressGroup> = {};
    
    Object.entries(addressGroups)
      .sort((a, b) => {
        const aLatestMessage = messages
          .filter(m => m.metadata?.address === a[0])
          .sort((m1, m2) => new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime())[0];
        
        const bLatestMessage = messages
          .filter(m => m.metadata?.address === b[0])
          .sort((m1, m2) => new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime())[0];

        if (!aLatestMessage || !bLatestMessage) return 0;
        return new Date(bLatestMessage.created_at).getTime() - new Date(aLatestMessage.created_at).getTime();
      })
      .forEach(([address, group]) => {
        const matchingResidents = group.residents.filter(resident => 
          resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resident.phones.some(phone => phone.includes(searchTerm)) ||
          address.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matchingResidents.length > 0) {
          filtered[address] = {
            ...group,
            residents: matchingResidents
          };
        }
      });

    return filtered;
  }, [addressGroups, searchTerm, messages]);

  const fetchMessages = async () => {
    try {
      if (!user) return;
      setLoading(true);

      const { data: reverseResults, error: reverseError } = await supabase
        .from('reverse_address_results')
        .select('*, location:locations(address, city, country)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reverseError) throw reverseError;

      // Adresleri ve telefon numaralarını gruplayalım
      const groups: Record<string, AddressGroup> = {};
      
      reverseResults?.forEach(result => {
        const address = `${result.location.address}, ${result.location.city}, ${result.location.country}`;
        
        if (!groups[address]) {
          groups[address] = {
            address,
            residents: []
          };
        }

        let residents = [];
        try {
          if (typeof result.current_residents === 'string') {
            residents = JSON.parse(result.current_residents);
          } else if (Array.isArray(result.current_residents)) {
            residents = result.current_residents;
          } else if (result.current_residents && typeof result.current_residents === 'object') {
            residents = [result.current_residents];
          }
        } catch (e) {
          console.error('Residents parse error:', e);
          residents = [];
        }

        residents.forEach((resident: any) => {
          if (resident && resident.phones && resident.phones.length > 0) {
            const phoneNumbers = resident.phones
              .split(',')
              .map((phone: string) => phone.trim())
              .filter((phone: string) => phone.length > 0);

            if (phoneNumbers.length > 0) {
              groups[address].residents.push({
                name: resident.name || 'İsimsiz',
                phones: phoneNumbers,
                address,
                age_range: resident.age_range || '',
                gender: resident.gender || ''
              });
            }
          }
        });
      });

      setAddressGroups(groups);

      // Sadece var olan mesajları alalım
      const { data: existingMessages, error: messagesError } = await supabase
        .from('sms_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      
      // Boş mesaj oluşturma kısmını kaldırdık
      setMessages(existingMessages || []);

    } catch (error) {
      setError('Mesajlar yüklenirken bir hata oluştu');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const toggleAddress = (address: string) => {
    const newExpanded = new Set(expandedAddresses);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedAddresses(newExpanded);
  };

  const toggleResident = (residentKey: string) => {
    const newExpanded = new Set(expandedResidents);
    if (newExpanded.has(residentKey)) {
      newExpanded.delete(residentKey);
    } else {
      newExpanded.add(residentKey);
    }
    setExpandedResidents(newExpanded);
  };

  const getGenderIcon = (gender?: string) => {
    switch(gender?.toLowerCase()) {
      case 'm':
      case 'male':
      case 'erkek':
        return <UserCircle className="h-4 w-4 text-blue-600" />;
      case 'f':
      case 'female':
      case 'kadın':
        return <UserCircle className="h-4 w-4 text-pink-600" />;
      default:
        return <UserCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const scrollToBottom = () => {
    // Scroll özelliğini kaldırdık
  };

  useEffect(() => {
    if (selectedPhone) {
      scrollToBottom();
    }
  }, [messages, selectedPhone]);

  const handleSendMessage = async (phone: string) => {
    if (!newMessage.trim() || !user) return;

    try {
      await sendSMS(phone, newMessage.trim(), user.id);
      setNewMessage('');
      await fetchMessages(); // Mesaj listesini yenile
      scrollToBottom();
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      setError('Mesaj gönderilemedi');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="İsim, telefon veya adres ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border-0 rounded-xl bg-white shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-2" />
            <p className="text-gray-500">Mesajlar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : Object.keys(filteredGroups).length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz mesaj bulunmuyor'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(filteredGroups).map(([address, group]) => {
              const totalPhones = group.residents.reduce((sum, resident) => 
                sum + resident.phones.length, 0);
              
              return (
                <div key={address} className="group">
                  <button
                    onClick={() => toggleAddress(address)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center 
                             justify-between text-left group-first:rounded-t-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 rounded-lg p-2">
                        <Home className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{address}</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {group.residents.length} kişi • {totalPhones} numara bulundu
                        </div>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200
                                ${expandedAddresses.has(address) ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {expandedAddresses.has(address) && (
                    <div className="space-y-3 p-4 pt-0">
                      {group.residents.map((resident) => {
                        const residentKey = `${address}-${resident.name}-${resident.phones.join()}`;
                        return (
                          <div key={residentKey} 
                               className="ml-4 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                            <button
                              onClick={() => toggleResident(residentKey)}
                              className="w-full px-4 py-3 flex items-center justify-between 
                                       hover:bg-gray-100 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`rounded-lg p-2 ${
                                  resident.gender?.toLowerCase() === 'f' ? 'bg-pink-100' :
                                  resident.gender?.toLowerCase() === 'm' ? 'bg-blue-100' :
                                  'bg-gray-100'
                                }`}>
                                  {getGenderIcon(resident.gender)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {resident.name}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-0.5">
                                    {resident.age_range && `${resident.age_range} • `}
                                    {resident.phones.length} telefon numarası
                                  </div>
                                </div>
                              </div>
                              <ChevronDown 
                                className={`h-4 w-4 text-gray-400 transition-transform duration-200
                                          ${expandedResidents.has(residentKey) ? 'rotate-180' : ''}`} 
                              />
                            </button>

                            {expandedResidents.has(residentKey) && (
                              <div className="border-t border-gray-100">
                                {resident.phones.map((phone) => {
                                  const phoneMessages = messages.filter(m => m.phone_number === phone);
                                  
                                  return (
                                    <div key={phone} className="border-b border-gray-100 last:border-b-0">
                                      <button
                                        onClick={() => setSelectedPhone(selectedPhone === phone ? null : phone)}
                                        className="w-full px-4 py-3 flex items-center justify-between 
                                                 hover:bg-gray-100 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="bg-gray-100 rounded-lg p-2">
                                            <Phone className="h-4 w-4 text-gray-600" />
                                          </div>
                                          <span className="text-sm font-medium text-gray-900">{phone}</span>
                                        </div>
                                        <ChevronDown 
                                          className={`h-4 w-4 text-gray-400 transition-transform duration-200
                                                    ${selectedPhone === phone ? 'rotate-180' : ''}`}
                                        />
                                      </button>

                                      {selectedPhone === phone && (
                                        <div className="fixed inset-0 z-50 bg-white lg:relative lg:bg-transparent">
                                          <div className="flex flex-col h-[400px] min-h-0 bg-white rounded-xl shadow-lg overflow-hidden">
                                            <div className="flex-1 overflow-y-auto p-4">
                                              {phoneMessages.length > 0 ? (
                                                <>
                                                  {phoneMessages.reduce((groups, message, index) => {
                                                    const messageDate = new Date(message.created_at).toDateString();
                                                    
                                                    if (index === 0 || messageDate !== new Date(phoneMessages[index - 1].created_at).toDateString()) {
                                                      groups.push(
                                                        <div key={`date-${messageDate}`} className="flex justify-center">
                                                          <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                                                            {formatMessageDate(message.created_at)}
                                                          </span>
                                                        </div>
                                                      );
                                                    }

                                                    groups.push(
                                                      <div key={message.id} className="space-y-2">
                                                        {(index === 0 || 
                                                          new Date(message.created_at).getTime() - 
                                                          new Date(phoneMessages[index - 1].created_at).getTime() > 300000) && (
                                                          <div className="flex justify-center">
                                                            <span className="text-xs text-gray-500 bg-white/50 px-2 py-0.5 rounded-full">
                                                              {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                              })}
                                                            </span>
                                                          </div>
                                                        )}
                                                        
                                                        <div className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                                          <div className={`group relative max-w-[80%] lg:max-w-[70%] ${
                                                            message.direction === 'outbound' 
                                                              ? 'bg-green-600 text-white' 
                                                              : 'bg-white text-gray-900'
                                                          } rounded-2xl px-4 py-2 shadow-sm min-h-[40px]`}>
                                                            <p className="text-sm whitespace-pre-wrap break-words mb-4">
                                                              {message.content}
                                                            </p>
                                                            
                                                            <div className={`absolute bottom-1 right-2 flex items-center gap-0.5
                                                              transition-opacity ${
                                                                message.direction === 'outbound' 
                                                                  ? 'opacity-75 group-hover:opacity-100' 
                                                                  : 'hidden'
                                                              }`}>
                                                              <span className="text-[10px] mr-1">
                                                                {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit'
                                                                })}
                                                              </span>
                                                              {message.status === 'delivered' ? (
                                                                <CheckCheck className="h-3 w-3" />
                                                              ) : message.status === 'pending' ? (
                                                                <Clock className="h-3 w-3" />
                                                              ) : (
                                                                <X className="h-3 w-3" />
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    );

                                                    return groups;
                                                  }, [] as JSX.Element[])}
                                                </>
                                              ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                  <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
                                                  <p className="text-sm">Henüz mesaj yok</p>
                                                  <p className="text-xs">Mesaj göndermek için aşağıdaki alanı kullanın</p>
                                                </div>
                                              )}
                                              <div ref={messagesEndRef} />
                                            </div>

                                            <div className="p-4 bg-white border-t border-gray-100">
                                              <form 
                                                onSubmit={(e) => {
                                                  e.preventDefault();
                                                  handleSendMessage(phone);
                                                }}
                                                className="flex items-center gap-2"
                                              >
                                                <div className="flex-1 relative">
                                                  <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Mesajınızı yazın..."
                                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-full 
                                                             focus:outline-none focus:ring-2 focus:ring-green-500/20 
                                                             placeholder:text-gray-400 text-sm"
                                                  />
                                                </div>
                                                <button
                                                  type="submit"
                                                  disabled={!newMessage.trim()}
                                                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-500 
                                                           disabled:opacity-50 disabled:cursor-not-allowed 
                                                           transition-colors duration-200"
                                                >
                                                  <Send className="h-5 w-5" />
                                                </button>
                                              </form>
                                            </div>
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
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};