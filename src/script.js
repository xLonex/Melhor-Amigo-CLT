// ---------- SISTEMA DE ESCOLHA DE CALCULADORA ---------- //
document.addEventListener("DOMContentLoaded", () => {
  const tipoCalculo = document.getElementById("tipoCalculo");
  const boxes = document.querySelectorAll("[id^='box-']");

  function mostrarBoxSelecionada() {
    const valorSelecionado = tipoCalculo.value;

    boxes.forEach((box) => {
      box.style.display = "none";
      box.style.opacity = "0";
    });

    const boxSelecionada = document.getElementById(`box-${valorSelecionado}`);
    if (boxSelecionada) {
      boxSelecionada.style.display = "block";
      setTimeout(() => {
        boxSelecionada.style.opacity = "1";
      }, 10);
    }
  }

  tipoCalculo.addEventListener("change", mostrarBoxSelecionada);
  mostrarBoxSelecionada();
});
// ---------- CÁLCULADORA DE RESCISÃO ---------- //
// Função para formatar valores monetários nos inputs
function formatarMoeda(event) {
  const input = event.target;
  let valor = input.value.replace(/\D/g, "");

  valor = valor.padStart(3, "0");
  const valorNumerico = Number(valor) / 100;

  input.value = valorNumerico.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(value) {
  return parseFloat(value.replace(/\D/g, "")) / 100;
}

// Configuração dos inputs monetários
document.querySelectorAll("#salario, #saldo_fgts").forEach((input) => {
  input.addEventListener("input", formatarMoeda);
  input.addEventListener("keydown", function (e) {
    if (!/\d|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) {
      e.preventDefault();
    }
  });

  input.addEventListener("blur", function () {
    let valor = parseCurrency(input.value);
    if (valor < 0) input.value = "R$ 0,00";
  });
});

function atualizarDataRescisao() {
  const dataAdmissao = document.getElementById("admissao").value;
  const dataRescisaoInput = document.getElementById("rescisao");

  if (dataAdmissao) {
    const dataMinima = new Date(dataAdmissao);
    dataMinima.setDate(dataMinima.getDate() + 1);
    const dataMinimaFormatada = dataMinima.toISOString().split("T")[0];

    dataRescisaoInput.min = dataMinimaFormatada;
    dataRescisaoInput.placeholder = dataMinima.toLocaleDateString("pt-BR");
  } else {
    dataRescisaoInput.removeAttribute("min");
    dataRescisaoInput.placeholder = "dd/mm/aaaa";
  }
}

//Sistema de Tooltip que explica o que cada coisa é para usuários mais leigos

document.querySelectorAll('[role="tooltip"]').forEach((tooltip) => {
  tooltip.addEventListener("click", (e) => e.stopPropagation());
});

document.addEventListener("click", () => {
  document.querySelectorAll('[role="tooltip"]').forEach((tooltip) => {
    tooltip.classList.add("hidden");
  });
});

// Sistema de Validação Revisado
class FormValidator {
  constructor() {
    this.errors = new Set();
    this.initEvents();
  }

  initEvents() {
    document.addEventListener("input", (e) => this.validateField(e.target));
    document.getElementById("admissao").addEventListener("input", (e) => {
      this.#handleAdmissaoChange(e.target);
    });
  }

  #handleAdmissaoChange(input) {
    atualizarDataRescisao();
    this.validateField(input);
    this.validateField(document.getElementById("rescisao"));
  }

  validateField(input) {
    this.clearFieldErrors(input);

    const value = input.value;
    const isValid = this.#checkValidity(input, value);

    if (!isValid && value) {
      this.#addDynamicError(input);
    } else if (isValid && value) {
      this.addPositiveFeedback(input, "Tudo certo");
    }
  }

  #checkValidity(input, value) {
    const rules = {
      admissao: (v) => !!v && !isNaN(new Date(v).getTime()),
      rescisao: (v) => {
        const admissao = new Date(document.getElementById("admissao").value);
        return !!v && new Date(v) > admissao;
      },
      salario: (v) => parseCurrency(v) > 0,
      motivo: (v) => !!v,
      aviso_previo: (v) => !!v,
      ferias_adquiridas: (v) => !!v,
      saldo_fgts: (v) => parseCurrency(v) >= 0,
      dependentes: (v) => parseInt(v) >= 0,
    };

    return rules[input.id] ? rules[input.id](value) : true;
  }

  #addDynamicError(input) {
    const messages = {
      rescisao: "Data deve ser posterior à admissão",
      salario: "Salário deve ser maior que zero",
      dependentes: "Não pode ser negativo",
      default: "Campo inválido",
    };

    this.addError(input, messages[input.id] || messages.default);
  }

  addError(input, message) {
    if (!this.errors.has(input.id)) {
      const error = document.createElement("p");
      error.className =
        "error-message text-red-500 dark:text-red-400 text-sm mt-1";
      error.textContent = message;
      input.parentNode.appendChild(error);
      input.classList.add("border-red-500");
      this.errors.add(input.id);
    }
  }

  addPositiveFeedback(input, message) {
    const feedback = document.createElement("p");
    feedback.className =
      "feedback-message text-green-500 dark:text-green-400 text-sm mt-1 flex items-center gap-1";
    feedback.innerHTML = `${message} <span class="emoji">${
      message.includes("Wow")
        ? "🤑👍"
        : message.includes("Uau")
        ? "👨👩👧👦👍"
        : "👍"
    }</span>`;

    input.parentNode.appendChild(feedback);
  }

  clearFieldErrors(input) {
    const error = input.parentNode.querySelector(".error-message");
    const feedback = input.parentNode.querySelector(".feedback-message");

    if (error) {
      error.remove();
      input.classList.remove("border-red-500");
      this.errors.delete(input.id);
    }

    if (feedback) {
      feedback.remove();
    }
  }

  clearAllErrors() {
    document
      .querySelectorAll(".error-message, .feedback-message")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".border-red-500")
      .forEach((el) => el.classList.remove("border-red-500"));
    this.errors.clear();
  }

  validateForm() {
    this.clearAllErrors();
    let isValid = true;

    document.querySelectorAll("input, select").forEach((input) => {
      if (!this.#checkValidity(input, input.value)) {
        this.addError(
          input,
          input.placeholder ? "Campo obrigatório" : "Valor inválido"
        );
        isValid = false;
      }
    });

    return isValid;
  }
}
// Inicializar validador
const formValidator = new FormValidator();

// Funções de cálculo
document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  if (!formValidator.validateForm()) return;

  const formData = {
    admissao: new Date(document.getElementById("admissao").value),
    rescisao: new Date(document.getElementById("rescisao").value),
    salario: parseCurrency(document.getElementById("salario").value),
    motivo: document.getElementById("motivo").value,
    aviso_previo: document.getElementById("aviso_previo").value,
    ferias_adquiridas: document.getElementById("ferias_adquiridas").value,
    saldo_fgts: parseCurrency(document.getElementById("saldo_fgts").value),
    dependentes: parseInt(document.getElementById("dependentes").value) || 0,
  };

  const calculo = calcularRescisao(formData);
  exibirResultados(calculo);
});

function calcularRescisao(data) {
  return {
    saldoSalario: calcularSaldoSalario(data.rescisao, data.salario),
    ferias: calcularFerias(
      data.admissao,
      data.rescisao,
      data.ferias_adquiridas === "sim",
      data.salario
    ),
    decimoTerceiro: calcularDecimoTerceiro(
      data.admissao,
      data.rescisao,
      data.salario
    ),
    avisoPrevio: calcularAvisoPrevio(
      data.aviso_previo,
      data.salario,
      data.admissao
    ),
    multaFGTS: calcularMultaFGTS(
      data.motivo,
      data.salario,
      data.admissao,
      data.rescisao,
      data.saldo_fgts
    ),
    total: 0,
  };
}

function calcularSaldoSalario(dataRescisao, salario) {
  const ultimoDiaMes = new Date(
    dataRescisao.getFullYear(),
    dataRescisao.getMonth() + 1,
    0
  );
  return (salario / ultimoDiaMes.getDate()) * dataRescisao.getDate();
}

function calcularFerias(admissao, rescisao, feriasVencidas, salario) {
  const mesesTrabalhados = Math.floor(
    (rescisao - admissao) / (1000 * 60 * 60 * 24 * 30)
  );
  let valor =
    feriasVencidas || mesesTrabalhados >= 12
      ? salario * 1.3333
      : (salario / 12) * mesesTrabalhados * 1.3333;
  return valor || 0;
}

function calcularDecimoTerceiro(admissao, rescisao, salario) {
  const meses =
    (rescisao.getFullYear() - admissao.getFullYear()) * 12 +
    rescisao.getMonth() -
    admissao.getMonth();
  return (salario / 12) * meses;
}

function calcularAvisoPrevio(tipo, salario, admissao) {
  const anos = Math.floor(
    (new Date() - admissao) / (1000 * 60 * 60 * 24 * 365)
  );
  const dias = Math.min(30 + anos * 3, 90);
  return tipo === "indenizado" ? (salario / 30) * dias : 0;
}

function calcularMultaFGTS(motivo, salario, admissao, rescisao, saldoAnterior) {
  if (["pedido_demissao", "dispensa_com_justa_causa"].includes(motivo))
    return 0;

  const meses = Math.floor((rescisao - admissao) / (1000 * 60 * 60 * 24 * 30));
  return (saldoAnterior + salario * 0.08 * meses) * 0.4;
}

// Exibição de resultados
function exibirResultados(calculo) {
  calculo.total = Object.values(calculo).reduce(
    (acc, val) => acc + (typeof val === "number" ? val : 0),
    0
  );

  const html = `
    <div class="mt-8 p-6 bg-blue-50 dark:bg-slate-700 rounded-lg">
      <h3 class="text-xl font-bold text-blue-800 dark:text-white mb-4">Resultado</h3>
      <dl class="space-y-3">
        ${Object.entries(calculo)
          .map(
            ([key, value]) => `
          <div class="flex justify-between ${
            key === "total" ? "border-t pt-3 font-bold" : ""
          }">
            <dt>${formatarLabel(key)}:</dt>
            <dd>${formatarMoedaResultado(value)}</dd>
          </div>
        `
          )
          .join("")}
      </dl>
    </div>
  `;

  document.querySelector("form").insertAdjacentHTML("afterend", html);
}

function formatarLabel(key) {
  const labels = {
    saldoSalario: "Saldo de Salário",
    ferias: "Férias Proporcionais",
    decimoTerceiro: "13º Proporcional",
    avisoPrevio: "Aviso Prévio",
    multaFGTS: "Multa do FGTS (40%)",
    total: "Total a Receber",
  };
  return labels[key] || key;
}

function formatarMoedaResultado(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---------- CÁLCULADORA DE 13º SALÁRIO ------ //
