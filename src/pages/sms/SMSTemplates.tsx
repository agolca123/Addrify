import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { MessageSquare, Plus, Pencil, Trash2, X } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export const SMSTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      setError('Şablonlar yüklenirken bir hata oluştu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('sms_templates')
          .update({ name, content })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        setMessage('Şablon başarıyla güncellendi');
      } else {
        const { error } = await supabase
          .from('sms_templates')
          .insert([{ name, content }]);

        if (error) throw error;
        setMessage('Şablon başarıyla oluşturuldu');
      }

      setShowForm(false);
      setEditingTemplate(null);
      setName('');
      setContent('');
      fetchTemplates();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Şablon kaydedilirken bir hata oluştu');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTemplates(templates.filter(template => template.id !== id));
      setMessage('Şablon başarıyla silindi');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Şablon silinirken bir hata oluştu');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          SMS Şablonları
        </h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingTemplate(null);
              setName('');
              setContent('');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'İptal' : 'Yeni Şablon'}
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Şablon Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mesaj İçeriği</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Kullanılabilir değişkenler: {'{ad}'}, {'{soyad}'}, {'{telefon}'}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
              >
                {editingTemplate ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-gray-600 mt-1">{template.content}</p>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">
                    Oluşturulma: {new Date(template.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};