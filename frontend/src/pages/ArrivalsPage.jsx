import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Plus,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { api } from '../api/client';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';

export function ArrivalsPage() {
  const [arrivals, setArrivals] = useState([]);
  const [factories, setFactories] = useState([]);
  const [products, setProducts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    factory_id: '',
    product_id: '',
    packaging_type: 'bulk',
    tonnage: '',
    price_per_ton: '',
    total_amount: '',
    vehicle_number: '',
    destination: 'warehouse',
    ticket_number: '',
    comment: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [arrRes, fRes, pRes, vRes] = await Promise.all([
        api.getArrivals(),
        api.getFactories(),
        api.getProducts(),
        api.getVehicles()
      ]);
      setArrivals(arrRes.data || []);
      setFactories(fRes.data || []);
      setProducts(pRes.data || []);
      setVehicles(vRes.data || []);

      if (fRes.data?.length > 0 && !formData.factory_id) {
        setFormData(prev => ({ ...prev, factory_id: fRes.data[0].id }));
      }
      if (pRes.data?.length > 0 && !formData.product_id) {
        setFormData(prev => ({
          ...prev,
          product_id: pRes.data[0].id,
          price_per_ton: pRes.data[0].purchase_price || ''
        }));
      }
    } catch (err) {
      console.error('Ошибка загрузки приходов:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const qty = parseFloat(formData.tonnage) || 0;
    const price = parseFloat(formData.price_per_ton) || 0;
    if (qty > 0 && price > 0) {
      setFormData(prev => ({ ...prev, total_amount: (qty * price).toString() }));
    }
  }, [formData.tonnage, formData.price_per_ton]);

  const handleProductChange = (prodId) => {
    const selected = products.find(p => p.id === parseInt(prodId));
    setFormData(prev => ({
      ...prev,
      product_id: prodId,
      price_per_ton: selected?.purchase_price ? selected.purchase_price.toString() : prev.price_per_ton,
      packaging_type: selected?.packaging_type === 'bag' ? 'bag' : 'bulk',
      factory_id: selected?.factory_id ? selected.factory_id.toString() : prev.factory_id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      if (!formData.tonnage || parseFloat(formData.tonnage) <= 0) {
        throw new Error('Введите корректный тоннаж');
      }
      if (formData.destination === 'ticket' && !formData.ticket_number.trim()) {
        throw new Error('При оприходовании в тикет необходимо указать номер тикета');
      }

      await api.createArrival(formData);
      setFeedback({ type: 'success', message: 'Поступление успешно оприходовано!' });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Ошибка оприходования' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Приход товаров
        </h1>

        <Button
          size="sm"
          onClick={() => {
            setIsModalOpen(true);
            setFeedback(null);
          }}
          className="h-7 px-2.5 text-xs font-medium"
        >
          <Plus className="h-3 w-3 mr-1" />
          Новый приход
        </Button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-muted border-border text-foreground'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <Card className="border-border">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Реестр поступлений</CardTitle>
          <Badge variant="outline">{arrivals.length} записей</Badge>
        </CardHeader>

        <CardContent className="p-0 sm:p-4 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium">
                  <th className="py-2.5 px-3">Дата</th>
                  <th className="py-2.5 px-3">Завод</th>
                  <th className="py-2.5 px-3">Продукция</th>
                  <th className="py-2.5 px-2">Фасовка</th>
                  <th className="py-2.5 px-3 text-right">Объем</th>
                  <th className="py-2.5 px-3 text-right">Закупка</th>
                  <th className="py-2.5 px-3 text-right">Сумма</th>
                  <th className="py-2.5 px-2">Транспорт</th>
                  <th className="py-2.5 px-2 text-center">Куда</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {arrivals.map((arr) => (
                  <tr key={arr.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(arr.date)}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{arr.factory_name}</td>
                    <td className="py-3 px-3">
                      {arr.product_name}
                      {arr.cement_grade && <span className="text-muted-foreground ml-1">[{arr.cement_grade}]</span>}
                    </td>
                    <td className="py-3 px-3">
                      {arr.packaging_type === 'bulk' ? 'Навал' : 'Мешки (50кг)'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">{formatNumber(arr.tonnage)} т</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{formatCurrency(arr.price_per_ton)}</td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">{formatCurrency(arr.total_amount)}</td>
                    <td className="py-3 px-3 font-mono">{arr.vehicle_number || '—'}</td>
                    <td className="py-3 px-3 text-center">
                      {arr.destination === 'warehouse' && <Badge variant="outline">Склад</Badge>}
                      {arr.destination === 'ticket' && <Badge variant="secondary">Тикет {arr.ticket_number ? `№${arr.ticket_number}` : ''}</Badge>}
                      {arr.destination === 'direct' && <Badge variant="outline">Напрямую</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* МОДАЛКА НОВОГО ПРИХОДА */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Новый приход цемента / материалов"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Дата" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            <Select label="Завод-производитель" required value={formData.factory_id} onChange={e => setFormData({ ...formData, factory_id: e.target.value })}>
              <option value="">Выберите завод...</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Товар" required value={formData.product_id} onChange={e => handleProductChange(e.target.value)}>
              <option value="">Выберите товар...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} [{p.cement_grade || ''}]</option>)}
            </Select>
            <Select label="Фасовка" value={formData.packaging_type} onChange={e => setFormData({ ...formData, packaging_type: e.target.value })}>
              <option value="bulk">Навал (россыпь)</option>
              <option value="bag">Мешок (50кг)</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input type="number" step="0.01" min="0.01" label="Тоннаж (т)" required value={formData.tonnage} onChange={e => setFormData({ ...formData, tonnage: e.target.value })} />
            <Input type="number" step="1" min="0" label="Цена за тонну" required value={formData.price_per_ton} onChange={e => setFormData({ ...formData, price_per_ton: e.target.value })} />
            <Input type="text" label="Итого сумма" readOnly value={formData.total_amount ? formatCurrency(formData.total_amount) : '0 сум'} className="bg-muted font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input type="text" label="Номер машины" placeholder="01 A 777 AA" value={formData.vehicle_number} onChange={e => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })} />
            <Select label="Назначение прихода" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })}>
              <option value="warehouse">На Склад (увеличить остаток)</option>
              <option value="ticket">Тикет (заводская квота)</option>
              <option value="direct">Напрямую клиенту (транзит)</option>
            </Select>
          </div>

          {formData.destination === 'ticket' && (
            <Input
              type="text"
              label="Номер тикета (квоты)"
              required
              placeholder="TKT-2026-001"
              value={formData.ticket_number}
              onChange={e => setFormData({ ...formData, ticket_number: e.target.value.toUpperCase() })}
            />
          )}

          <Input type="text" label="Комментарий / Накладная" value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })} />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button type="submit" isLoading={submitting}>Сохранить приход</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
