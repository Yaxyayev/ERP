import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Users,
  Building2,
  Truck,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { api } from '../api/client';
import { formatCurrency, formatNumber } from '../lib/utils';

export function DirectoriesPage() {
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'factories' | 'vehicles' | 'products'
  const [clients, setClients] = useState([]);
  const [factories, setFactories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cRes, fRes, vRes, pRes] = await Promise.all([
        api.getClients(),
        api.getFactories(),
        api.getVehicles(),
        api.getProducts()
      ]);
      setClients(cRes.data || []);
      setFactories(fRes.data || []);
      setVehicles(vRes.data || []);
      setProducts(pRes.data || []);
    } catch (err) {
      console.error('Ошибка загрузки справочников:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    if (activeTab === 'clients') {
      setFormData({ name: '', phone: '', company_name: '', balance: 0, notes: '' });
    } else if (activeTab === 'factories') {
      setFormData({ name: '', contact_person: '', phone: '', address: '', notes: '' });
    } else if (activeTab === 'vehicles') {
      setFormData({ plate_number: '', model: '', client_id: '', is_company_owned: 1, driver_name: '', driver_phone: '', notes: '' });
    } else if (activeTab === 'products') {
      setFormData({
        name: '',
        category: 'cement',
        cement_grade: 'M500',
        packaging_type: 'bulk',
        unit: 'т',
        current_stock: 0,
        min_stock_alert: 20,
        purchase_price: '',
        selling_price: '',
        factory_id: factories[0]?.id || ''
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      if (activeTab === 'clients') {
        if (modalMode === 'create') await api.createClient(formData);
        else await api.updateClient(editingItem.id, formData);
      } else if (activeTab === 'factories') {
        if (modalMode === 'create') await api.createFactory(formData);
        else await api.updateFactory(editingItem.id, formData);
      } else if (activeTab === 'vehicles') {
        if (modalMode === 'create') await api.createVehicle(formData);
        else await api.updateVehicle(editingItem.id, formData);
      } else if (activeTab === 'products') {
        if (modalMode === 'create') await api.createProduct(formData);
        else await api.updateProduct(editingItem.id, formData);
      }

      setFeedback({ type: 'success', message: 'Данные справочника успешно сохранены!' });
      setIsModalOpen(false);
      loadAll();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Ошибка сохранения' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить эту запись?')) return;
    try {
      if (activeTab === 'clients') await api.deleteClient(id);
      else if (activeTab === 'factories') await api.deleteFactory(id);
      else if (activeTab === 'vehicles') await api.deleteVehicle(id);
      else if (activeTab === 'products') await api.deleteProduct(id);
      setFeedback({ type: 'success', message: 'Запись удалена' });
      loadAll();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Ошибка удаления' });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Справочники
        </h1>

        <Button
          size="sm"
          onClick={openCreateModal}
          className="h-7 px-2.5 text-xs font-medium"
        >
          <Plus className="h-3 w-3 mr-1" />
          Добавить
        </Button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border text-foreground text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="inline-flex items-center rounded-lg border border-border bg-muted p-1 text-muted-foreground text-xs">
        <button
          onClick={() => setActiveTab('clients')}
          className={`rounded-md px-3 py-1 font-medium transition-all ${
            activeTab === 'clients' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
          }`}
        >
          Клиенты ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`rounded-md px-3 py-1 font-medium transition-all ${
            activeTab === 'vehicles' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
          }`}
        >
          Автопарк ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('factories')}
          className={`rounded-md px-3 py-1 font-medium transition-all ${
            activeTab === 'factories' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
          }`}
        >
          Заводы ({factories.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`rounded-md px-3 py-1 font-medium transition-all ${
            activeTab === 'products' ? 'bg-background text-foreground shadow-sm font-semibold' : 'hover:text-foreground'
          }`}
        >
          Каталог товаров ({products.length})
        </button>
      </div>

      {/* 1. КЛИЕНТЫ */}
      {activeTab === 'clients' && (
        <Card className="border-border">
          <CardContent className="p-0 sm:p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground font-medium">
                    <th className="py-2.5 px-4">Имя / Организация</th>
                    <th className="py-2.5 px-3">Телефон</th>
                    <th className="py-2.5 px-3 text-right">Текущий баланс</th>
                    <th className="py-2.5 px-4">Примечание</th>
                    <th className="py-2.5 px-4 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {c.name}
                        {c.company_name && <span className="block text-[11px] text-muted-foreground font-normal">{c.company_name}</span>}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{c.phone || '—'}</td>
                      <td className={`py-3 px-3 text-right font-medium ${c.balance < 0 ? 'text-destructive font-semibold' : 'text-foreground'}`}>
                        {formatCurrency(c.balance)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{c.notes || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(c)}>
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. АВТОПАРК */}
      {activeTab === 'vehicles' && (
        <Card className="border-border">
          <CardContent className="p-0 sm:p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground font-medium">
                    <th className="py-2.5 px-4">Гос. номер</th>
                    <th className="py-2.5 px-3">Модель</th>
                    <th className="py-2.5 px-3">Тип</th>
                    <th className="py-2.5 px-3">Водитель</th>
                    <th className="py-2.5 px-3">Телефон</th>
                    <th className="py-2.5 px-4 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{v.plate_number}</td>
                      <td className="py-3 px-3 text-muted-foreground">{v.model || '—'}</td>
                      <td className="py-3 px-3">
                        {v.is_company_owned ? <Badge variant="outline">Собственная</Badge> : <Badge variant="secondary">Наёмная</Badge>}
                      </td>
                      <td className="py-3 px-3">{v.driver_name || '—'}</td>
                      <td className="py-3 px-3 text-muted-foreground">{v.driver_phone || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(v)}>
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(v.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. ЗАВОДЫ */}
      {activeTab === 'factories' && (
        <Card className="border-border">
          <CardContent className="p-0 sm:p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground font-medium">
                    <th className="py-2.5 px-4">Завод</th>
                    <th className="py-2.5 px-3">Контакт</th>
                    <th className="py-2.5 px-3">Телефон</th>
                    <th className="py-2.5 px-4">Локация</th>
                    <th className="py-2.5 px-4 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {factories.map(f => (
                    <tr key={f.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{f.name}</td>
                      <td className="py-3 px-3 text-muted-foreground">{f.contact_person || '—'}</td>
                      <td className="py-3 px-3 text-muted-foreground">{f.phone || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{f.address || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(f)}>
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(f.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. ТОВАРЫ */}
      {activeTab === 'products' && (
        <Card className="border-border">
          <CardContent className="p-0 sm:p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground font-medium">
                    <th className="py-2.5 px-4">Наименование</th>
                    <th className="py-2.5 px-3">Категория</th>
                    <th className="py-2.5 px-3">Завод</th>
                    <th className="py-2.5 px-3 text-right">Закупка</th>
                    <th className="py-2.5 px-3 text-right">Продажа</th>
                    <th className="py-2.5 px-4 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {p.name}
                        {p.cement_grade && <span className="ml-1 text-muted-foreground text-[11px]">[{p.cement_grade}]</span>}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {p.category === 'cement' ? 'Цемент' : p.category === 'packaging' ? 'Тара' : 'Добавка'}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{p.factory_name || '—'}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{formatCurrency(p.purchase_price)}</td>
                      <td className="py-3 px-3 text-right font-medium text-foreground">{formatCurrency(p.selling_price)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(p)}>
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* МОДАЛКА ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${modalMode === 'create' ? 'Добавление' : 'Редактирование'}: ${
          activeTab === 'clients' ? 'Клиента' : activeTab === 'vehicles' ? 'Машины' : activeTab === 'factories' ? 'Завода' : 'Товара'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'clients' && (
            <>
              <Input label="ФИО / Наименование" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Input label="Телефон" placeholder="+998 90 123-45-67" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              <Input label="Компания / Заказчик" value={formData.company_name || ''} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
              <Input label="Примечание" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </>
          )}

          {activeTab === 'vehicles' && (
            <>
              <Input label="Гос. номер" required placeholder="01 A 777 AA" value={formData.plate_number || ''} onChange={e => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })} />
              <Input label="Марка / Модель" placeholder="HOWO / MAN" value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} />
              <Select label="Принадлежность" value={formData.is_company_owned} onChange={e => setFormData({ ...formData, is_company_owned: parseInt(e.target.value) })}>
                <option value="1">Собственный транспорт компании</option>
                <option value="0">Наёмный транспорт перевозчика</option>
              </Select>
              <Input label="Водитель" value={formData.driver_name || ''} onChange={e => setFormData({ ...formData, driver_name: e.target.value })} />
              <Input label="Телефон водителя" value={formData.driver_phone || ''} onChange={e => setFormData({ ...formData, driver_phone: e.target.value })} />
            </>
          )}

          {activeTab === 'factories' && (
            <>
              <Input label="Название завода" required placeholder="Бекабадцемент" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Input label="Контактное лицо" value={formData.contact_person || ''} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
              <Input label="Телефон" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              <Input label="Адрес" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </>
          )}

          {activeTab === 'products' && (
            <>
              <Input label="Наименование" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Категория" value={formData.category || 'cement'} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="cement">Цемент</option>
                  <option value="packaging">Тара (мешки)</option>
                  <option value="additive">Добавки</option>
                </Select>
                <Input label="Марка цемента" placeholder="M400, M500" value={formData.cement_grade || ''} onChange={e => setFormData({ ...formData, cement_grade: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Фасовка" value={formData.packaging_type || 'bulk'} onChange={e => setFormData({ ...formData, packaging_type: e.target.value })}>
                  <option value="bulk">Навал</option>
                  <option value="bag">Мешок</option>
                  <option value="none">Без фасовки</option>
                </Select>
                <Input label="Единица измерения" value={formData.unit || 'т'} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" label="Цена закупки (сум)" value={formData.purchase_price || ''} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} />
                <Input type="number" label="Цена продажи (сум)" value={formData.selling_price || ''} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} />
              </div>
              <Select label="Завод" value={formData.factory_id || ''} onChange={e => setFormData({ ...formData, factory_id: e.target.value })}>
                <option value="">Без завода...</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit" isLoading={submitting}>Сохранить</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
