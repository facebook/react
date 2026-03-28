import {Suspense} from 'react';
import StatsGrid from './StatsGrid';
import ProductTable from './ProductTable';
import ActivityFeed from './ActivityFeed';
import ChartPanel from './ChartPanel';
import Skeleton from './Skeleton';
import {generateProducts, generateActivities, generateStats} from './data';

function fetchData(generator, ...args) {
  return new Promise(resolve => {
    setTimeout(() => resolve(generator(...args)), 1);
  });
}

async function AsyncStatsSection() {
  const stats = await fetchData(generateStats);
  return <StatsGrid stats={stats} />;
}

async function AsyncProductSection({itemCount}) {
  const products = await fetchData(generateProducts, itemCount);
  return <ProductTable products={products} />;
}

async function AsyncChartSection() {
  const stats = await fetchData(generateStats);
  return (
    <ChartPanel title="Revenue" data={stats.revenueByMonth} type="bar" />
  );
}

async function AsyncActivitySection({itemCount}) {
  const activities = await fetchData(
    generateActivities,
    Math.min(itemCount, 50)
  );
  return <ActivityFeed activities={activities} />;
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
          <Suspense fallback={<Skeleton type="table" />}>
            <AsyncProductSection itemCount={itemCount} />
          </Suspense>
        </div>
        <div className="dashboard-aside">
          <Suspense fallback={<Skeleton type="chart" />}>
            <AsyncChartSection />
          </Suspense>
          <Suspense fallback={<Skeleton type="feed" />}>
            <AsyncActivitySection itemCount={itemCount} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
