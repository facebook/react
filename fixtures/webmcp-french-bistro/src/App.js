import {WebMCPProvider} from 'react-webmcp';
import ReservationForm from './components/ReservationForm';
import './styles/bistro.css';

export default function App() {
  return (
    <WebMCPProvider>
      <ReservationForm />
    </WebMCPProvider>
  );
}
