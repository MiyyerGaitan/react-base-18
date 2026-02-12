import Footer from './Footer.jsx';
import '../styles/App.css';

function App() {
  return (
    <div className="container">
      <h1>Seguimiento de Restricciones Médicas</h1>
      <form>
        <label htmlFor="cedula">Número de Documento:</label>
          <input
            type="text"
            id="cedula"
            name="cedula"
            required
            placeholder="Ingrese su cédula"
          />
        <button type="submit">
          Consultar
        </button>  
      </form>
      <Footer />
    </div>
  )
}

export default App