import Header from './Header';
import Layout from './Layout';
import ProductListAsync from './ProductListAsync';

export default function AppAsync({itemCount}) {
  return (
    <html>
      <body>
        <Header title="Flight SSR Benchmark (Async)" />
        <Layout>
          <ProductListAsync count={itemCount} />
        </Layout>
      </body>
    </html>
  );
}
