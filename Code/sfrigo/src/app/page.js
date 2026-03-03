import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-slate-50 text-slate-800">
      {/* HERO */}
      <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-6">
        <div className="max-w-3xl text-center">
          <div className="text-5xl mb-6">🧊🥦</div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Il frigorifero condiviso, senza sprechi
          </h1>

          <p className="text-lg text-emerald-100 mb-8">
            Monitora gli alimenti, condividi le scorte e organizza gli spazi
            in modo semplice e collaborativo.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-white text-emerald-600 font-medium hover:bg-emerald-50 transition"
            >
              Accedi
            </Link>

            <Link
              href="/register"
              className="px-6 py-3 rounded-xl border border-white font-medium hover:bg-white/10 transition"
            >
              Registrati
            </Link>
          </div>
        </div>
      </section>

      {/* OBIETTIVO */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-3xl font-semibold mb-4">Obiettivo</h2>

            <p className="text-slate-600 leading-relaxed">
              L’app aiuta a gestire e organizzare gli alimenti in un frigorifero
              condiviso. Permette di monitorare le scorte, migliorare la
              collaborazione tra più utenti e ridurre gli sprechi in modo pratico
              e immediato.
            </p>
          </div>

          <div className="bg-emerald-50 border rounded-2xl p-8">
            <ul className="space-y-3 text-slate-700">
              <li>✔ Monitoraggio delle scorte</li>
              <li>✔ Collaborazione tra utenti</li>
              <li>✔ Riduzione degli sprechi</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FUNZIONALITÀ */}
      <section className="py-24 px-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold mb-12 text-center">
            Cosa puoi fare
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border hover:shadow-md transition">
              ⏳ Controllare scadenze e quantità per ridurre gli sprechi
            </div>

            <div className="p-6 rounded-2xl bg-white border hover:shadow-md transition">
              👥 Condividere gli alimenti con altri utenti
            </div>

            <div className="p-6 rounded-2xl bg-white border hover:shadow-md transition">
              🧺 Organizzare prodotti per categorie e spazi
            </div>

            <div className="p-6 rounded-2xl bg-white border hover:shadow-md transition">
              🍳 Ricevere ricette basate su ciò che hai già
            </div>
          </div>
        </div>
      </section>

      {/* CONTESTI */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Dove usarla</h2>

        <div className="grid md:grid-cols-2 gap-4 text-slate-600">
          <div className="p-4 border rounded-xl bg-white">🏠 Case condivise</div>
          <div className="p-4 border rounded-xl bg-white">👨‍👩‍👧‍👦 Famiglie</div>
          <div className="p-4 border rounded-xl bg-white">🎓 Residenze universitarie</div>
          <div className="p-4 border rounded-xl bg-white">🏢 Ambienti di lavoro</div>
        </div>
      </section>

      {/* VISIONE */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-4xl mb-6">🌍</div>

          <h2 className="text-3xl font-semibold mb-8">Visione</h2>

          <p className="text-lg text-slate-700 leading-relaxed">
            Offrire uno strumento semplice, intuitivo e affidabile per la gestione
            collaborativa degli alimenti.
          </p>

          <div className="mt-10 bg-white border rounded-2xl p-8 shadow-sm">
            <p className="text-slate-600 leading-relaxed">
              L’obiettivo è ottimizzare i consumi, migliorare l’organizzazione e
              promuovere un uso più consapevole delle risorse.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <h2 className="text-3xl font-semibold mb-4">
          Inizia a organizzare il tuo frigorifero
        </h2>

        <p className="text-emerald-100 mb-8">
          Crea un account o accedi per iniziare subito.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-white text-emerald-600 font-medium hover:bg-emerald-50 transition"
          >
            Accedi
          </Link>

          <Link
            href="/register"
            className="px-6 py-3 rounded-xl border border-white font-medium hover:bg-white/10 transition"
          >
            Registrati
          </Link>
        </div>
      </section>
    </main>
  );
}