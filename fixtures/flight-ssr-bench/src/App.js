import Header from './Header';
import Layout from './Layout';
import ProductList from './ProductList';

export default function App({itemCount}) {
  return (
    <html>
      <body>
        <Header title="Flight SSR Benchmark" />
        <Layout>
          <ProductList count={itemCount} />
        </Layout>
      </body>
    </html>
  );
}
