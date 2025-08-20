// 🔹 IMPORTS FIREBASE MODULAR
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

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

// 🔹 INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 Login
document.getElementById("formLogin").addEventListener("submit", async e=>{
  e.preventDefault();
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    document.getElementById("login").classList.add("oculto");
    document.getElementById("app").classList.remove("oculto");
    renderizar();
  } catch(err){
    document.getElementById("erroLogin").innerText = "Email ou senha incorretos!";
  }
});

// 🔹 Logout
window.logout = async function(){
  await signOut(auth);
  document.getElementById("app").classList.add("oculto");
  document.getElementById("login").classList.remove("oculto");
}

// 🔹 Mostrar aba
function mostrarAba(id){
  document.querySelectorAll(".aba").forEach(a=>a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
}

// 🔹 Renderizar dados
async function renderizar(){
  // Orçamentos
  const listaOrc = document.getElementById("listaOrcamentos");
  listaOrc.innerHTML = "";
  const orcamentos = await getDocs(collection(db,"orcamentos"));
  orcamentos.forEach(docSnap=>{
    const o = docSnap.data();
    listaOrc.innerHTML += `
      <div class="card">
        <b>${o.cliente}</b> - ${o.servico}<br>
        📅 Entrega: ${o.dataEntrega}<br>
        💰 Valor: R$ ${o.valor.toFixed(2)} (${o.entrada>0?"Entrada: R$"+o.entrada.toFixed(2):"Sem entrada"})
        <div>Fotos: ${o.fotos.map(f=><img src="${f}" alt="foto">).join("")}</div>
        <button onclick="fecharServico('${docSnap.id}')">Fechar Serviço</button>
      </div>
    `;
  });

  // Serviços a Fazer
  const listaAF = document.getElementById("listaAFazer");
  listaAF.innerHTML = "";
  const aFazer = await getDocs(collection(db,"a_fazer"));
  aFazer.forEach(docSnap=>{
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

  // Serviços Prontos
  const listaP = document.getElementById("listaProntos");
  listaP.innerHTML = "";
  const prontos = await getDocs(collection(db,"prontos"));
  prontos.forEach(docSnap=>{
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
    await addDoc(collection(db,"orcamentos"), {cliente,telefone,servico,valor,entrada,dataEntrega,fotos});
    renderizar();
  } else {
    for(let f of files){
      let reader = new FileReader();
      reader.onload = async e=>{
        fotos.push(e.target.result);
        if(fotos.length===files.length){
          await addDoc(collection(db,"orcamentos"), {cliente,telefone,servico,valor,entrada,dataEntrega,fotos});
          renderizar();
        }
      };
      reader.readAsDataURL(f);
    }
  }
});

// 🔹 Fechar serviço
window.fecharServico = async function(id){
  const docRef = doc(db,"orcamentos",id);
  const docSnap = await getDoc(docRef);
  const sData = docSnap.data();
  await addDoc(collection(db,"a_fazer"), sData);
  await deleteDoc(docRef);
  window.open(https://wa.me/55${sData.telefone}?text=${encodeURIComponent(`Olá, aqui é da Sapataria Passos! Seu conserto estará pronto em ${sData.dataEntrega}.)}`,"_blank");
  renderizar();
}

// 🔹 Marcar pronto
window.marcarPronto = async function(id){
  const docRef = doc(db,"a_fazer",id);
  const docSnap = await getDoc(docRef);
  const sData = docSnap.data();
  await addDoc(collection(db,"prontos"), sData);
  await deleteDoc(docRef);
  window.open(https://wa.me/55${sData.telefone}?text=${encodeURIComponent("Olá, aqui é da Sapataria Passos! Seu concerto está pronto!")},"_blank");
  renderizar();
}