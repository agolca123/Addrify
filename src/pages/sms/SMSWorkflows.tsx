import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { WorkflowForm } from '../../components/sms/WorkflowForm';
import {
  GitBranch,
  Plus,
  X,
  Play,
  Pause,
  Trash2
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: string;
  created_at: string;
}

export const SMSWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      setError('İş akışları yüklenirken bir hata oluştu');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sms_workflows')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setWorkflows(workflows.map(workflow => 
        workflow.id === id ? { ...workflow, status: newStatus } : workflow
      ));
      
      setMessage('İş akışı durumu güncellendi');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Durum güncellenirken bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu iş akışını silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('sms_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWorkflows(workflows.filter(workflow => workflow.id !== id));
      setMessage('İş akışı silindi');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('İş akışı silinirken bir hata oluştu');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6" />
          SMS İş Akışları
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'İptal' : 'Yeni İş Akışı'}
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
          <h2 className="text-lg font-semibold mb-4">Yeni İş Akışı Oluştur</h2>
          <WorkflowForm
            onSuccess={() => {
              setShowForm(false);
              fetchWorkflows();
              setMessage('İş akışı başarıyla oluşturuldu');
              setTimeout(() => setMessage(''), 3000);
            }}
            onError={(error) => setError(error)}
          />
        </div>
      )}

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{workflow.name}</h3>
                <p className="text-gray-600 mt-1">{workflow.description}</p>
                <div className="mt-2 space-x-4">
                  <span className="text-sm text-gray-500">
                    Tetikleyici: {workflow.trigger}
                  </span>
                  <span className="text-sm text-gray-500">
                    Oluşturulma: {new Date(workflow.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStatusChange(workflow.id, workflow.status === 'active' ? 'paused' : 'active')}
                  className={`p-2 rounded-md ${
                    workflow.status === 'active'
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {workflow.status === 'active' ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(workflow.id)}
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