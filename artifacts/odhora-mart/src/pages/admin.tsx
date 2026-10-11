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
import './admin.css';

const statuses: AdminOrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const orderValueStatuses = new Set<AdminOrderStatus>(['pending', 'confirmed', 'shipped', 'delivered']);
const statusNames: Record<AdminOrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
        <Link href="/" className="admin-back-link" data-testid="link-admin-shop"><ArrowLeft size={15} /> Back to the shop</Link>
        <span className="admin-lock-mark"><LockKeyhole size={17} /> OWNER ACCESS</span>
      </div>
      <section className="admin-login-card">
        <div className="admin-login-flower" aria-hidden="true"><ShieldCheck size={25} /></div>
        <p className="admin-overline">Odhora Mart · private</p>
        <h1>Your order desk.</h1>
        <p className="admin-login-copy">A quiet place to keep every parcel moving. Enter your admin password to continue.</p>
        {sessionError && <div className="admin-alert" role="status" data-testid="status-session-error">{sessionError}</div>}
        {error && <div className="admin-alert" role="alert" data-testid="status-login-error">{error}</div>}
        <form onSubmit={submit} className="admin-login-form" data-testid="form-admin-login">
          <label htmlFor="admin-password">Admin password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            data-testid="input-admin-password"
          />
          <button className="admin-submit" type="submit" disabled={isPending || !password.trim()} data-testid="button-admin-login">
            {isPending ? 'Checking access…' : <>Open order desk <ArrowRight size={16} /></>}
          </button>
        </form>
        <div className="admin-secure-note"><LockKeyhole size={13} /> Your session is secured with a private server cookie.</div>
      </section>
      <div className="admin-login-footer"><span>ODHORA MART</span><span>Good things, on their way.</span></div>
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
          <div className="admin-order-id"><span>ORDER</span> {order.orderNumber}</div>
          <div className="admin-order-date"><Clock3 size={13} /> {formatDate(order.createdAt)}</div>
        </div>
        <span className={`admin-status status-${order.status}`} data-testid={`status-admin-order-${order.id}`}>{statusNames[order.status]}</span>
      </div>
      <div className="admin-order-body">
        <section className="admin-customer">
          <span className="admin-section-label">CUSTOMER</span>
          <h2>{order.customerName}</h2>
          <a href={`tel:${order.phone}`} data-testid={`link-order-phone-${order.id}`}>{order.phone}</a>
          {order.email && <a className="admin-email" href={`mailto:${order.email}`} data-testid={`link-order-email-${order.id}`}>{order.email}</a>}
        </section>
        <section className="admin-address">
          <span className="admin-section-label">DELIVER TO</span>
          <p>{order.address}</p>
          <p>{[order.area, order.city].filter(Boolean).join(', ')}</p>
          {order.note && <div className="admin-note"><span>DELIVERY NOTE</span>{order.note}</div>}
        </section>
        <section className="admin-items">
          <span className="admin-section-label">IN THE PARCEL · {order.items.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</span>
          <ul>
            {order.items.map((item, index) => (
              <li key={`${item.productId}-${index}`} data-testid={`text-admin-order-item-${order.id}-${index}`}>
                <span>{item.name}<small> × {item.quantity}</small></span>
                <strong>৳{new Intl.NumberFormat('en-BD').format(item.unitPrice * item.quantity)}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="admin-order-foot">
        <div className="admin-total"><span>ORDER TOTAL</span><strong data-testid={`text-admin-order-total-${order.id}`}>{formatTotal(order)}</strong></div>
        <label className="admin-status-control">
          <span>Update progress</span>
          <select
            value={order.status}
            disabled={isUpdating || isDeleting}
            onChange={(event) => onStatusChange(order, event.target.value as AdminOrderStatus)}
            aria-label={`Update status for order ${order.orderNumber}`}
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
          <Trash2 size={14} /> Delete order
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
        <Link href="/" className="admin-brand" data-testid="link-admin-brand"><span className="admin-brand-mark">o</span><span>odh<span>ora</span> mart<small>OWNER ORDER DESK</small></span></Link>
        <div className="admin-header-right"><span className="admin-session-indicator"><i /> SESSION SECURE</span><button type="button" className="admin-logout" onClick={onLogout} disabled={logoutPending} data-testid="button-admin-logout"><LogOut size={15} />{logoutPending ? 'Signing out…' : 'Sign out'}</button></div>
      </header>
      <div className="admin-main">
        <div className="admin-heading-row">
          <div><p className="admin-overline">THE SHOP, AT A GLANCE</p><h1>Order desk<span>.</span></h1><p className="admin-subtitle">Every order, from first hello to front door.</p></div>
          <div className="admin-today-mark"><PackageCheck size={19} /><span>TAKE CARE<br /><strong>OF THE DETAILS</strong></span></div>
        </div>
        <section className="admin-summary" aria-label="Order overview">
          <div className="admin-stat"><span>ALL ORDERS</span><strong>{isLoading ? '—' : orders?.length ?? 0}</strong><small>Since opening the shop</small></div>
          <div className="admin-stat admin-stat-pending"><span>NEEDS A LOOK</span><strong>{isLoading ? '—' : pendingCount}</strong><small>Waiting to be confirmed</small></div>
          <div className="admin-stat"><span>ORDER VALUE</span><strong>{isLoading ? '—' : `৳${new Intl.NumberFormat('en-BD').format(revenue)}`}</strong><small>Excludes cancelled orders</small></div>
          <div className="admin-stat admin-stat-note"><Truck size={20} /><p>Small touches make<br />a lovely delivery.</p></div>
        </section>
        <section className="admin-orders-section">
          <div className="admin-orders-title">
            <div><p className="admin-overline">YOUR CUSTOMERS ARE HERE</p><h2>Recent orders <span>{orders?.length ?? 0}</span></h2></div>
            <label className="admin-search"><Search size={16} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders or customers" aria-label="Search orders" data-testid="input-admin-search" /></label>
          </div>
          <div className="admin-filter-row" role="group" aria-label="Filter orders by status">
            <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')} data-testid="filter-admin-all">All orders <span>{orders?.length ?? 0}</span></button>
            {statuses.map((status) => {
              const count = (orders || []).filter((order) => order.status === status).length;
              return <button type="button" key={status} className={filter === status ? 'is-active' : ''} onClick={() => setFilter(status)} data-testid={`filter-admin-${status}`}>{statusNames[status]} <span>{count}</span></button>;
            })}
          </div>
          {updateError && <div className="admin-alert admin-update-alert" role="alert" data-testid="status-admin-update-error">{updateError}</div>}
          {isLoading ? (
            <div className="admin-order-list" aria-label="Loading orders" data-testid="status-admin-orders-loading">
              {[0, 1, 2].map((item) => <div className="admin-order-skeleton" key={item}><div /><div /><div /></div>)}
            </div>
          ) : isError ? (
            <div className="admin-orders-error" role="alert" data-testid="status-admin-orders-error"><div className="admin-error-icon"><RefreshCw size={20} /></div><h3>Orders are taking a moment.</h3><p>{errorMessage(error, 'We couldn’t load the order list. Please try again.')}</p><button type="button" onClick={refetch} data-testid="button-admin-retry">Try again <RefreshCw size={14} /></button></div>
          ) : !orders?.length ? (
            <div className="admin-orders-empty" data-testid="status-admin-orders-empty"><div className="admin-empty-icon"><PackageCheck size={24} /></div><p className="admin-overline">A FRESH PAGE</p><h3>No orders just yet.</h3><p>When a customer checks out, their order will be waiting here.</p><Link href="/" className="admin-empty-link" data-testid="link-admin-empty-shop">Visit the storefront <ArrowRight size={14} /></Link></div>
          ) : filteredOrders.length ? (
            <div className="admin-order-list" data-testid="list-admin-orders">
              {filteredOrders.map((order) => <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} onRequestDelete={setOrderToDelete} isUpdating={updatingId === order.id} isDeleting={isDeleting} />)}
            </div>
          ) : (
            <div className="admin-no-matches" data-testid="status-admin-no-matches"><Search size={20} /><span>No orders match this view.</span><button type="button" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button></div>
          )}
        </section>
        <footer className="admin-footnote"><Check size={14} /> Order updates are saved securely and reflected in the shop’s records. <span>ODHORA MART · WITH CARE</span></footer>
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
            <AlertDialogTitle>Delete {orderToDelete?.orderNumber ?? 'this order'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the order and its customer details. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="admin-delete-dialog-footer">
            <AlertDialogCancel disabled={isDeleting} className="admin-delete-cancel">Keep order</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmDelete}
              className="admin-delete-confirm"
              data-testid="button-confirm-delete-order"
            >
              {isDeleting ? 'Deleting…' : 'Delete order'}
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
      onError: (error) => setLoginError(errorMessage(error, 'That password didn’t work. Please try again.')),
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
      onError: (error) => setUpdateError(errorMessage(error, 'We couldn’t sign you out. Please try again.')),
    });
  };

  const changeStatus = (order: AdminOrder, status: AdminOrderStatus) => {
    if (status === order.status) return;
    setUpdateError('');
    updateOrder.mutate({ id: order.id, data: { status } }, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ordersKey });
      },
      onError: (error) => setUpdateError(errorMessage(error, 'We couldn’t update this order. Please try again.')),
    });
  };

  const removeOrder = async (order: AdminOrder): Promise<boolean> => {
    setUpdateError('');
    try {
      await deleteOrder.mutateAsync({ id: order.id });
      await queryClient.invalidateQueries({ queryKey: ordersKey });
      return true;
    } catch (error) {
      setUpdateError(errorMessage(error, 'We couldn’t delete this order. Please try again.'));
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
        sessionError={sessionQuery.isError ? errorMessage(sessionQuery.error, 'We couldn’t verify an existing session. Enter your password to continue.') : ''}
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
