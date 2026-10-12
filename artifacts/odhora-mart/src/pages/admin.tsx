import { useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getGetAdminSessionQueryKey,
  getListAdminOrdersQueryKey,
  useCreateAdminSession,
  useDeleteAdminOrder,
  useDeleteAdminSession,
  useGetAdminSession,
  useListAdminOrders,
  useUpdateAdminOrderStatus,
} from '@workspace/api-client-react';
import type { AdminOrder, AdminOrderStatus } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock3, LockKeyhole, LogOut, PackageCheck, RefreshCw, Search, ShieldCheck, Trash2, Truck } from 'lucide-react';
import { bengaliProductName, orderStatusLabels } from '@/lib/bengali';
import './admin.css';

const statuses: AdminOrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const orderValueStatuses = new Set<AdminOrderStatus>(['pending', 'confirmed', 'shipped', 'delivered']);
const statusNames: Record<AdminOrderStatus, string> = orderStatusLabels;

function errorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error
    ? error.message
    : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  if (message && /[\u0980-\u09ff]/.test(message)) return message;
  return fallback;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatTotal(order: AdminOrder) {
  return `${order.currency === 'BDT' ? '৳' : ''}${new Intl.NumberFormat('en-BD').format(order.total)}${order.currency !== 'BDT' ? ` ${order.currency}` : ''}`;
}

function AccessPage({
  onLogin,
  isPending,
  error,
  sessionError,
}: {
  onLogin: (password: string) => void;
  isPending: boolean;
  error: string;
  sessionError: string;
}) {
  const [password, setPassword] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(password);
    setPassword('');
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-top">
        <Link href="/" className="admin-back-link" data-testid="link-admin-shop"><ArrowLeft size={15} /> দোকানে ফিরে যান</Link>
        <span className="admin-lock-mark"><LockKeyhole size={17} /> মালিকের প্রবেশাধিকার</span>
      </div>
      <section className="admin-login-card">
        <div className="admin-login-flower" aria-hidden="true"><ShieldCheck size={25} /></div>
        <p className="admin-overline">ওধোরা মার্ট · ব্যক্তিগত</p>
        <h1>আপনার অর্ডার দেখুন</h1>
        <p className="admin-login-copy">প্রতিটি পার্সেলের অগ্রগতি দেখার ব্যক্তিগত জায়গা। চালিয়ে যেতে অ্যাডমিন পাসওয়ার্ড লিখুন।</p>
        {sessionError && <div className="admin-alert" role="status" data-testid="status-session-error">{sessionError}</div>}
        {error && <div className="admin-alert" role="alert" data-testid="status-login-error">{error}</div>}
        <form onSubmit={submit} className="admin-login-form" data-testid="form-admin-login">
          <label htmlFor="admin-password">অ্যাডমিন পাসওয়ার্ড</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="পাসওয়ার্ড লিখুন"
            data-testid="input-admin-password"
          />
          <button className="admin-submit" type="submit" disabled={isPending || !password.trim()} data-testid="button-admin-login">
            {isPending ? 'প্রবেশ যাচাই হচ্ছে…' : <>অর্ডার দেখুন <ArrowRight size={16} /></>}
          </button>
        </form>
        <div className="admin-secure-note"><LockKeyhole size={13} /> আপনার সেশন নিরাপদ সার্ভার কুকি দিয়ে সুরক্ষিত।</div>
      </section>
      <div className="admin-login-footer"><span>ODHORA MART</span><span>ভালো জিনিস, আপনার পথে।</span></div>
    </main>
  );
}

function OrderCard({ order, onStatusChange, onRequestDelete, isUpdating, isDeleting }: {
  order: AdminOrder;
  onStatusChange: (order: AdminOrder, status: AdminOrderStatus) => void;
  onRequestDelete: (order: AdminOrder) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  return (
    <article className="admin-order-card" data-testid={`card-admin-order-${order.id}`}>
      <div className="admin-order-head">
        <div>
          <div className="admin-order-id"><span>অর্ডার</span> {order.orderNumber}</div>
          <div className="admin-order-date"><Clock3 size={13} /> {formatDate(order.createdAt)}</div>
        </div>
        <span className={`admin-status status-${order.status}`} data-testid={`status-admin-order-${order.id}`}>{statusNames[order.status]}</span>
      </div>
      <div className="admin-order-body">
        <section className="admin-customer">
          <span className="admin-section-label">কাস্টমার</span>
          <h2>{order.customerName}</h2>
          <a href={`tel:${order.phone}`} data-testid={`link-order-phone-${order.id}`}>{order.phone}</a>
          {order.email && <a className="admin-email" href={`mailto:${order.email}`} data-testid={`link-order-email-${order.id}`}>{order.email}</a>}
        </section>
        <section className="admin-address">
          <span className="admin-section-label">ডেলিভারি ঠিকানা</span>
          <p>{order.address}</p>
          <p>{[order.area, order.city].filter(Boolean).join(', ')}</p>
          {order.note && <div className="admin-note"><span>ডেলিভারি নোট</span>{order.note}</div>}
        </section>
        <section className="admin-items">
          <span className="admin-section-label">পার্সেলে · {order.items.reduce((sum, item) => sum + item.quantity, 0)} টি পণ্য</span>
          <ul>
            {order.items.map((item, index) => (
              <li key={`${item.productId}-${index}`} data-testid={`text-admin-order-item-${order.id}-${index}`}>
                <span>{bengaliProductName(item.name)}<small> × {item.quantity}</small></span>
                <strong>৳{new Intl.NumberFormat('en-BD').format(item.unitPrice * item.quantity)}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="admin-order-foot">
        <div className="admin-total"><span>মোট মূল্য</span><strong data-testid={`text-admin-order-total-${order.id}`}>{formatTotal(order)}</strong></div>
        <label className="admin-status-control">
          <span>অবস্থা আপডেট করুন</span>
          <select
            value={order.status}
            disabled={isUpdating || isDeleting}
            onChange={(event) => onStatusChange(order, event.target.value as AdminOrderStatus)}
            aria-label={`অর্ডার ${order.orderNumber} এর অবস্থা আপডেট করুন`}
            data-testid={`select-admin-order-status-${order.id}`}
          >
            {statuses.map((status) => <option key={status} value={status}>{statusNames[status]}</option>)}
          </select>
          {isUpdating ? <RefreshCw size={14} className="admin-spin" /> : <ArrowUpRight size={14} />}
        </label>
        <button
          type="button"
          className="admin-delete-button"
          disabled={isUpdating || isDeleting}
          onClick={() => onRequestDelete(order)}
          data-testid={`button-delete-order-${order.id}`}
        >
          <Trash2 size={14} /> অর্ডার ডিলিট করুন
        </button>
      </div>
    </article>
  );
}

function OrdersDashboard({ orders, isLoading, isError, error, refetch, onLogout, logoutPending, onStatusChange, updatingId, updateError, onDeleteOrder, isDeleting }: {
  orders: AdminOrder[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  onLogout: () => void;
  logoutPending: boolean;
  onStatusChange: (order: AdminOrder, status: AdminOrderStatus) => void;
  updatingId: number | null;
  updateError: string;
  onDeleteOrder: (order: AdminOrder) => Promise<boolean>;
  isDeleting: boolean;
}) {
  const [filter, setFilter] = useState<'all' | AdminOrderStatus>('all');
  const [search, setSearch] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);
  const sortedOrders = useMemo(() => [...(orders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [orders]);
  const filteredOrders = sortedOrders.filter((order) => (
    (filter === 'all' || order.status === filter)
    && `${order.orderNumber} ${order.customerName} ${order.phone}`.toLowerCase().includes(search.toLowerCase().trim())
  ));
  const pendingCount = (orders || []).filter((order) => order.status === 'pending').length;
  const revenue = (orders || []).reduce(
    (sum, order) => orderValueStatuses.has(order.status) ? sum + order.total : sum,
    0,
  );

  const confirmDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!orderToDelete) return;
    await onDeleteOrder(orderToDelete);
    setOrderToDelete(null);
  };

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <Link href="/" className="admin-brand" data-testid="link-admin-brand"><span className="admin-brand-mark">o</span><span>odh<span>ora</span> mart<small>মালিকের অর্ডার ডেস্ক</small></span></Link>
        <div className="admin-header-right"><span className="admin-session-indicator"><i /> সেশন নিরাপদ</span><button type="button" className="admin-logout" onClick={onLogout} disabled={logoutPending} data-testid="button-admin-logout"><LogOut size={15} />{logoutPending ? 'সাইন আউট হচ্ছে…' : 'সাইন আউট'}</button></div>
      </header>
      <div className="admin-main">
        <div className="admin-heading-row">
          <div><p className="admin-overline">দোকানের এক নজর</p><h1>অর্ডার দেখুন<span>।</span></h1><p className="admin-subtitle">প্রতিটি অর্ডার, প্রথম কথা থেকে আপনার দরজা পর্যন্ত।</p></div>
          <div className="admin-today-mark"><PackageCheck size={19} /><span>বিস্তারিত তথ্য<br /><strong>যত্ন নিয়ে দেখুন</strong></span></div>
        </div>
        <section className="admin-summary" aria-label="অর্ডারের সারাংশ">
          <div className="admin-stat"><span>সব অর্ডার</span><strong>{isLoading ? '—' : orders?.length ?? 0}</strong><small>দোকান খোলার পর থেকে</small></div>
          <div className="admin-stat admin-stat-pending"><span>দেখা প্রয়োজন</span><strong>{isLoading ? '—' : pendingCount}</strong><small>নিশ্চিতকরণের অপেক্ষায়</small></div>
          <div className="admin-stat"><span>মোট অর্ডার মূল্য</span><strong>{isLoading ? '—' : `৳${new Intl.NumberFormat('en-BD').format(revenue)}`}</strong><small>বাতিল অর্ডার বাদে</small></div>
          <div className="admin-stat admin-stat-note"><Truck size={20} /><p>ছোট যত্নেই<br />ডেলিভারি সুন্দর হয়।</p></div>
        </section>
        <section className="admin-orders-section">
          <div className="admin-orders-title">
            <div><p className="admin-overline">আপনার ক্রেতারা এখানে</p><h2>সাম্প্রতিক অর্ডার <span>{orders?.length ?? 0}</span></h2></div>
            <label className="admin-search"><Search size={16} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="অর্ডার বা ক্রেতা খুঁজুন" aria-label="অর্ডার খুঁজুন" data-testid="input-admin-search" /></label>
          </div>
          <div className="admin-filter-row" role="group" aria-label="অবস্থা অনুযায়ী অর্ডার ফিল্টার">
            <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')} data-testid="filter-admin-all">সব অর্ডার <span>{orders?.length ?? 0}</span></button>
            {statuses.map((status) => {
              const count = (orders || []).filter((order) => order.status === status).length;
              return <button type="button" key={status} className={filter === status ? 'is-active' : ''} onClick={() => setFilter(status)} data-testid={`filter-admin-${status}`}>{statusNames[status]} <span>{count}</span></button>;
            })}
          </div>
          {updateError && <div className="admin-alert admin-update-alert" role="alert" data-testid="status-admin-update-error">{updateError}</div>}
          {isLoading ? (
            <div className="admin-order-list" aria-label="অর্ডার লোড হচ্ছে" data-testid="status-admin-orders-loading">
              {[0, 1, 2].map((item) => <div className="admin-order-skeleton" key={item}><div /><div /><div /></div>)}
            </div>
          ) : isError ? (
            <div className="admin-orders-error" role="alert" data-testid="status-admin-orders-error"><div className="admin-error-icon"><RefreshCw size={20} /></div><h3>অর্ডারগুলো আনতে একটু সময় লাগছে।</h3><p>{errorMessage(error, 'অর্ডারের তালিকা আনা যায়নি। আবার চেষ্টা করুন।')}</p><button type="button" onClick={refetch} data-testid="button-admin-retry">আবার চেষ্টা করুন <RefreshCw size={14} /></button></div>
          ) : !orders?.length ? (
            <div className="admin-orders-empty" data-testid="status-admin-orders-empty"><div className="admin-empty-icon"><PackageCheck size={24} /></div><p className="admin-overline">নতুন শুরু</p><h3>এখনো কোনো অর্ডার নেই।</h3><p>ক্রেতারা অর্ডার করলেই এখানে তা দেখা যাবে।</p><Link href="/" className="admin-empty-link" data-testid="link-admin-empty-shop">দোকান দেখুন <ArrowRight size={14} /></Link></div>
          ) : filteredOrders.length ? (
            <div className="admin-order-list" data-testid="list-admin-orders">
              {filteredOrders.map((order) => <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} onRequestDelete={setOrderToDelete} isUpdating={updatingId === order.id} isDeleting={isDeleting} />)}
            </div>
          ) : (
            <div className="admin-no-matches" data-testid="status-admin-no-matches"><Search size={20} /><span>এই তালিকায় কোনো অর্ডার নেই।</span><button type="button" onClick={() => { setSearch(''); setFilter('all'); }}>ফিল্টার মুছুন</button></div>
          )}
        </section>
        <footer className="admin-footnote"><Check size={14} /> অর্ডারের পরিবর্তন নিরাপদে সংরক্ষিত হয় এবং দোকানের তালিকায় দেখা যায়। <span>ODHORA MART · যত্নসহকারে</span></footer>
      </div>
      <AlertDialog
        open={orderToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setOrderToDelete(null);
        }}
      >
        <AlertDialogContent className="admin-delete-dialog" data-testid="dialog-delete-order-confirm">
          <AlertDialogHeader className="admin-delete-dialog-header">
          <span className="admin-delete-dialog-icon"><Trash2 size={18} /></span>
            <AlertDialogTitle>অর্ডার {orderToDelete?.orderNumber ?? ''} ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এতে অর্ডার ও ক্রেতার তথ্য স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="admin-delete-dialog-footer">
            <AlertDialogCancel disabled={isDeleting} className="admin-delete-cancel">অর্ডারটি রাখুন</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmDelete}
              className="admin-delete-confirm"
              data-testid="button-confirm-delete-order"
            >
              {isDeleting ? 'মুছে ফেলা হচ্ছে…' : 'অর্ডার ডিলিট করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const sessionKey = getGetAdminSessionQueryKey();
  const ordersKey = getListAdminOrdersQueryKey();
  const sessionQuery = useGetAdminSession({ query: { queryKey: sessionKey, retry: false, staleTime: 0 } });
  const ordersQuery = useListAdminOrders({ query: { queryKey: ordersKey, enabled: sessionQuery.data?.authenticated === true, retry: false } });
  const createSession = useCreateAdminSession();
  const deleteOrder = useDeleteAdminOrder();
  const deleteSession = useDeleteAdminSession();
  const updateOrder = useUpdateAdminOrderStatus();
  const [loginError, setLoginError] = useState('');
  const [updateError, setUpdateError] = useState('');

  const login = (submittedPassword: string) => {
    setLoginError('');
    createSession.mutate({ data: { password: submittedPassword } }, {
      onSuccess: async (session) => {
        queryClient.setQueryData(sessionKey, session);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: sessionKey }),
          queryClient.invalidateQueries({ queryKey: ordersKey }),
        ]);
      },
      onError: (error) => setLoginError(errorMessage(error, 'পাসওয়ার্ডটি সঠিক নয়। আবার চেষ্টা করুন।')),
    });
  };

  const logout = () => {
    deleteSession.mutate(undefined, {
      onSuccess: async () => {
        queryClient.removeQueries({ queryKey: sessionKey });
        queryClient.removeQueries({ queryKey: ordersKey });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: sessionKey }),
          queryClient.invalidateQueries({ queryKey: ordersKey }),
        ]);
      },
      onError: (error) => setUpdateError(errorMessage(error, 'সাইন আউট করা যায়নি। আবার চেষ্টা করুন।')),
    });
  };

  const changeStatus = (order: AdminOrder, status: AdminOrderStatus) => {
    if (status === order.status) return;
    setUpdateError('');
    updateOrder.mutate({ id: order.id, data: { status } }, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ordersKey });
      },
      onError: (error) => setUpdateError(errorMessage(error, 'অর্ডারটি আপডেট করা যায়নি। আবার চেষ্টা করুন।')),
    });
  };

  const removeOrder = async (order: AdminOrder): Promise<boolean> => {
    setUpdateError('');
    try {
      await deleteOrder.mutateAsync({ id: order.id });
      await queryClient.invalidateQueries({ queryKey: ordersKey });
      return true;
    } catch (error) {
      setUpdateError(errorMessage(error, 'অর্ডারটি ডিলিট করা যায়নি। আবার চেষ্টা করুন।'));
      return false;
    }
  };

  if (sessionQuery.isLoading) {
    return <main className="admin-login-page"><div className="admin-loading-card" data-testid="status-admin-session-loading"><div className="admin-loading-mark" /><div className="admin-skeleton-line" /><div className="admin-skeleton-line short" /><div className="admin-skeleton-input" /></div></main>;
  }

  if (sessionQuery.data?.authenticated !== true) {
    return (
      <AccessPage
        onLogin={login}
        isPending={createSession.isPending}
        error={loginError}
        sessionError={sessionQuery.isError ? errorMessage(sessionQuery.error, 'আগের সেশন যাচাই করা যায়নি। চালিয়ে যেতে পাসওয়ার্ড লিখুন।') : ''}
      />
    );
  }

  return (
    <OrdersDashboard
      orders={ordersQuery.data}
      isLoading={ordersQuery.isLoading}
      isError={ordersQuery.isError}
      error={ordersQuery.error}
      refetch={() => { void ordersQuery.refetch(); }}
      onLogout={logout}
      logoutPending={deleteSession.isPending}
      onStatusChange={changeStatus}
      updatingId={updateOrder.isPending ? updateOrder.variables?.id ?? null : null}
      updateError={updateError}
      onDeleteOrder={removeOrder}
      isDeleting={deleteOrder.isPending}
    />
  );
}
