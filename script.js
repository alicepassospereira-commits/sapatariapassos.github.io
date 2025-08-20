// 🔹 CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBnlLE3-auOj2t4y-bMrweeuNoXclZuW_Y",
  authDomain: "sapataria-passos.firebaseapp.com",
  projectId: "sapataria-passos",
  storageBucket: "sapataria-passos.firebasestorage.app",
  messagingSenderId: "1048911524511",
  appId: "1:1048911524511:web:ada0055b1c85bd8cc4e8aa",
  measurementId: "G-24GWQ36G39"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🔹 Mostrar aba
function mostrarAba(id) {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
}

// 🔹 Renderizar todos os dados
async function renderizar() {
  const listaOrc = document.getElementById("listaOrcamentos");
  listaOrc.innerHTML = "";
  const orcamentos = await db.collection("orcamentos").get();
  orcamentos.forEach(docSnap => {
    const o = docSnap.data();
    listaOrc.innerHTML += `
      <div class="card">
        <b>${o.cliente}</b> - ${o.servico}<br>
        📅 Entrega: ${o.dataEntrega}<br>
        💰 Valor: R$ ${o.valor.toFixed(2)} (${o.entrada>0?"Entrada: R$"+o.entrada.toFixed(2):"Sem entrada"})
        <div>Fotos: ${o.fotos.map(f=><img src="${f}" alt="foto">).join("")}</div>
        <button onclick="fecharServico('${docSnap.id}')">Fechar Orçamento</button>
      </div>
    `;
  });

  const listaAF = document.getElementById("listaAFazer");
  listaAF.innerHTML = "";
  const aFazer = await db.collection("a_fazer").get();
  aFazer.forEach(docSnap => {
    const s = docSnap.data();
    let restante = s.valor - s.entrada;
    listaAF.innerHTML += `
      <div class="card">
        <b>${s.cliente}</b> - ${s.servico}<br>
        📅 Entrega: ${s.dataEntrega}<br>
        💰 Total: R$ ${s.valor.toFixed(2)}<br>
        ${s.entrada>0?"💵 Pago: R$"+s.entrada.toFixed(2)+" | Falta: R$"+restante.toFixed(2):"Não pago"}
        <div>Fotos: ${s.fotos.map(f=><img src="${f}" alt="foto">).join("")}</div>
        <button onclick="marcarPronto('${docSnap.id}')">Pronto</button>
      </div>
    `;
  });

  const listaP = document.getElementById("listaProntos");
  listaP.innerHTML = "";
  const prontos = await db.collection("prontos").get();
  prontos.forEach(docSnap => {
    const p = docSnap.data();
    listaP.innerHTML += `
      <div class="card">
        <b>${p.cliente}</b> - ${p.servico}<br>
        ✅ Conserto Pronto<br>
        📅 Entrega: ${p.dataEntrega}<br>
        💰 Total: R$ ${p.valor.toFixed(2)} (${p.entrada>=p.valor?"Pago":"Falta pagar"})
        <div>Fotos: ${p.fotos.map(f=><img src="${f}" alt="foto">).join("")}</div>
      </div>
    `;
  });

  // Agenda
  const listaAgenda = document.getElementById("listaAgenda");
  listaAgenda.innerHTML = "";
  const dataSelecionada = document.getElementById("dataAgenda").value;
  if(dataSelecionada){
    const todosAF = await db.collection("a_fazer").where("dataEntrega","==",dataSelecionada).get();
    todosAF.forEach(docSnap=>{
      const s = docSnap.data();
      listaAgenda.innerHTML += <div class="card"><b>${s.cliente}</b> - ${s.servico} | Entrega: ${s.dataEntrega}</div>;
    });
  }
}

// 🔹 Adicionar orçamento
document.getElementById("formOrcamento").addEventListener("submit", async e=>{
  e.preventDefault();
  const cliente = document.getElementById("cliente").value;
  const telefone = document.getElementById("telefone").value;
  const servico = document.getElementById("servico").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const entrada = parseFloat(document.getElementById("entrada").value) || 0;
  const dataEntrega = document.getElementById("dataEntrega").value;
  const fotos = [];

  const files = document.getElementById("fotos").files;
  if(files.length===0){
    await db.collection("orcamentos").add({cliente,telefone,servico,valor,entrada,dataEntrega,fotos,status:"orcamento"});
    renderizar();
  } else {
    for (let f of files){
      let reader = new FileReader();
      reader.onload = async e=>{
        fotos.push(e.target.result);
        if(fotos.length===files.length){
          await db.collection("orcamentos").add({cliente,telefone,servico,valor,entrada,dataEntrega,fotos,status:"orcamento"});
          renderizar();
        }
      };
      reader.readAsDataURL(f);
    }
  }
});

// 🔹 Fechar serviço → enviar WhatsApp e mover para "a_fazer"
window.fecharServico = async function(id){
  const docRef = db.collection("orcamentos").doc(id);
  const docSnap = await docRef.get();
  const s = docSnap.data();
  await db.collection("a_fazer").add(s);
  await docRef.delete();
  window.open(https://wa.me/55${s.telefone}?text=${encodeURIComponent(`Olá, aqui é da Sapataria Passos! Seu conserto estará pronto em ${s.dataEntrega}.)}`, "_blank");
  renderizar();
}

// 🔹 Marcar como pronto → enviar WhatsApp e mover para "prontos"
window.marcarPronto = async function(id){
  const docRef = db.collection("a_fazer").doc(id);
  const docSnap = await docRef.get();
  const s = docSnap.data();
  await db.collection("prontos").add(s);
  await docRef.delete();
  window.open(https://wa.me/55${s.telefone}?text=${encodeURIComponent("Olá, aqui é da Sapataria Passos! Seu conserto está pronto!")}, "_blank");
  renderizar();
}

// 🔹 Atualizar agenda ao mudar data
document.getElementById("dataAgenda").addEventListener("change", renderizar);

// 🔹 Inicializar renderização
renderizar();