export default function ContactosPage() {
  return (
    <main className="min-h-screen bg-white p-10">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Contactos</h1>

      <p className="text-gray-700 mb-4">📍 Local: Avenida Capitão António Gomes Rocha nº18, 2745 Queluz, Monte Abraão</p>
      <p className="text-gray-700 mb-4">📞 Telefone: +351 968 633 307</p>
      <p className="text-gray-700 mb-8">✉️ Email: terapiasmanuaisabobora@gmail.com</p>

      {/* Mapa Satélite Google Maps */}
      <div className="w-full h-[450px] rounded-lg overflow-hidden shadow-lg">
        <iframe
          title="Localização - Samuel Abóbora"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.321063516019!2d-9.2612733!3d38.7550984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1eced78b9f9b73%3A0xfeb06a1f81c9cc17!2sAv.%20Capit%C3%A3o%20Ant%C3%B3nio%20Gomes%20Rocha%2018%2C%202745-163%20Queluz!5e0!3m2!1spt-PT!2spt!4v1730202012345!5m2!1spt-PT!2spt&maptype=satellite"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </main>
  );
}
