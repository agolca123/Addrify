import { useState } from 'react';
import { supabase } from '../../config/supabase';

interface WorkflowFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({ onSuccess, onError }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('manual');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('sms_workflows')
        .insert([
          {
            name,
            description,
            trigger,
            status: 'active'
          }
        ]);

      if (error) throw error;
      
      setName('');
      setDescription('');
      setTrigger('manual');
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Workflow oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">İş Akışı Adı</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tetikleyici</label>
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="manual">Manuel</option>
          <option value="scheduled">Zamanlanmış</option>
          <option value="event">Olay Bazlı</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
      >
        {isLoading ? 'Oluşturuluyor...' : 'İş Akışı Oluştur'}
      </button>
    </form>
  );
}; 