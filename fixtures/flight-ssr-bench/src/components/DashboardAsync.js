import {Suspense} from 'react';
import StatsGrid from './StatsGrid';
import TableRow from './TableRow';
import TableHeader from './TableHeader';
import Pagination from './Pagination';
import ActivityItem from './ActivityItem';
import ChartPanel from './ChartPanel';
import Skeleton from './Skeleton';
import {generateProducts, generateActivities, generateStats} from './data';

function fetchData(generator, ...args) {
  return new Promise(resolve => {
    setTimeout(() => resolve(generator(...args)), 1);
  });
}

function fetchDelayed(value, delayMs) {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), delayMs);
  });
}

async function AsyncStatsSection() {
  const stats = await fetchData(generateStats);
  return <StatsGrid stats={stats} />;
}

const productColumns = [
  {key: 'name', label: 'Product'},
  {key: 'sku', label: 'SKU'},
  {key: 'category', label: 'Category'},
  {key: 'price', label: 'Price'},
  {key: 'stock', label: 'Stock'},
  {key: 'status', label: 'Status'},
  {key: 'rating', label: 'Rating'},
];

async function AsyncProductRow({product, delay}) {
  const resolved = await fetchDelayed(product, delay);
  return <TableRow product={resolved} columns={productColumns} />;
}

function AsyncProductSection({itemCount}) {
  const products = generateProducts(itemCount);
  return (
    <div className="product-table-container">
      <div className="table-toolbar">
        <h2>Products</h2>
        <span className="table-count">{products.length} items</span>
      </div>
      <table className="product-table">
        <thead>
          <tr>
            {productColumns.map(col => (
              <TableHeader key={col.key} column={col} />
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <Suspense key={product.id} fallback={<tr><td colSpan={7}>Loading...</td></tr>}>
              <AsyncProductRow product={product} delay={1 + (i % 5)} />
            </Suspense>
          ))}
        </tbody>
      </table>
      <Pagination total={products.length} pageSize={20} />
    </div>
  );
}

async function AsyncChartSection() {
  const stats = await fetchData(generateStats);
  return (
    <ChartPanel title="Revenue" data={stats.revenueByMonth} type="bar" />
  );
}

async function AsyncActivityItem({activity, delay}) {
  const resolved = await fetchDelayed(activity, delay);
  return (
    <ActivityItem
      type={resolved.type}
      user={resolved.user}
      message={resolved.message}
      timestamp={resolved.timestamp}
      details={resolved.details}
    />
  );
}

function AsyncActivitySection({itemCount}) {
  const activities = generateActivities(Math.min(itemCount, 50));
  return (
    <div className="activity-feed">
      <h3>Recent Activity</h3>
      <ul className="activity-list">
        {activities.map((activity, i) => (
          <Suspense key={activity.id} fallback={<li>Loading...</li>}>
            <AsyncActivityItem activity={activity} delay={1 + (i % 5)} />
          </Suspense>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardAsync({itemCount}) {
  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p className="dashboard-subtitle">
          Welcome back. Here is what is happening with your store today.
        </p>
      </div>
      <Suspense fallback={<Skeleton type="stats" />}>
        <AsyncStatsSection />
      </Suspense>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <AsyncProductSection itemCount={itemCount} />
        </div>
        <div className="dashboard-aside">
          <Suspense fallback={<Skeleton type="chart" />}>
            <AsyncChartSection />
          </Suspense>
          <AsyncActivitySection itemCount={itemCount} />
        </div>
      </div>
    </main>
  );
}
