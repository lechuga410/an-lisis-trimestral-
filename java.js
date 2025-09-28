function safeParseInt(val) {
    const n = parseInt(val);
    return isNaN(n) ? 0 : n;
}

function safeParseFloat(val) {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
}

let errores = []; // Definido globalmente

function calcularTasas() {
    const realizadas = document.querySelectorAll('.realizadas');
    const ganadoras = document.querySelectorAll('.ganadoras');
    const perdedoras = document.querySelectorAll('.perdedoras');

    let totalRealizadas = 0;
    let totalGanadoras = 0;
    let totalPerdedoras = 0;

    for (let i = 0; i < realizadas.length; i++) {
        totalRealizadas += safeParseInt(realizadas[i].value);
        totalGanadoras += safeParseInt(ganadoras[i].value);
        totalPerdedoras += safeParseInt(perdedoras[i].value);
    }

    let tasaAcierto = totalRealizadas > 0 ? (totalGanadoras / totalRealizadas) * 100 : 0;
    let tasaFracaso = totalRealizadas > 0 ? (totalPerdedoras / totalRealizadas) * 100 : 0;

    const resultadoDiv = document.getElementById('resultado-tasa');
    if (resultadoDiv) {
        resultadoDiv.innerText = 
            "Tasa de acierto del trimestre: " + tasaAcierto.toFixed(2) + "%\n" +
            "Tasa de fracaso del trimestre: " + tasaFracaso.toFixed(2) + "%";
    }
}

function generarResumenTrimestral() {
    
    const verificarCapital = safeParseFloat(document.getElementById('capital-inicial')?.value);
    if ( verificarCapital === 0){
        alert("ingresa los datos del capital inicial");
        return;
    }

    const anio = document.getElementById('año')?.value || '';
    const selectTrimestre = document.getElementById('trimestre-select');
    const trimestreText = selectTrimestre?.options[selectTrimestre.selectedIndex].text || '';
    const trimestreValue = selectTrimestre?.value || 't1';
    const capitalInicial = safeParseFloat(document.querySelector('input[placeholder="capital inical del trimestre"]')?.value);

    function getMesData(num) {
        return {
            realizadas: safeParseInt(document.getElementById(`realizadas${num}`)?.value),
            ganadoras: safeParseInt(document.getElementById(`ganadoras${num}`)?.value),
            perdedoras: safeParseInt(document.getElementById(`perdedoras${num}`)?.value),
            breakeven: safeParseInt(document.getElementById(`breakeven${num}`)?.value),
            netogan: safeParseFloat(document.getElementById(`netogan${num}`)?.value),
            netoperd: safeParseFloat(document.getElementById(`netoperd${num}`)?.value)
        };
    }

    const mes1 = getMesData(1);
    const mes2 = getMesData(2);
    const mes3 = getMesData(3);

    const totalRealizadas = mes1.realizadas + mes2.realizadas + mes3.realizadas;
    const totalGanadoras = mes1.ganadoras + mes2.ganadoras + mes3.ganadoras;
    const totalPerdedoras = mes1.perdedoras + mes2.perdedoras + mes3.perdedoras;
    const totalBreakeven = mes1.breakeven + mes2.breakeven + mes3.breakeven;

    const sumaResultados = totalGanadoras + totalPerdedoras + totalBreakeven;
    if (sumaResultados > totalRealizadas) {
        alert("⚠️ La suma de ganadoras, perdedoras y breakeven es mayor que el total de operaciones realizadas.");
        return;
    }

    const totalNetoGan = mes1.netogan + mes2.netogan + mes3.netogan;
    const totalNetoPerd = mes1.netoperd + mes2.netoperd + mes3.netoperd;

    const avgWin = totalGanadoras > 0 ? totalNetoGan / totalGanadoras : 0;
    const avgLoss = totalPerdedoras > 0 ? totalNetoPerd / totalPerdedoras : 0;
    const ratio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : "N/A";

    // --- Primero leemos las rachas / netos relativos (antes de usarlos para formatear) ---
    const rachaPerdidas = safeParseInt(document.getElementById('racha-p')?.value);
    const costoPerdida = safeParseFloat(document.getElementById('neto-p')?.value);
    const rachaGanancias = safeParseInt(document.getElementById('racha-g')?.value);
    const gananciaConsecutiva = safeParseFloat(document.getElementById('neto-g')?.value);

    // Total neto (considerando que netoperd puede venir positivo o negativo)
    let totalNeto;
    if (totalNetoPerd <= 0) {
        totalNeto = totalNetoGan + totalNetoPerd; // pérdidas ya con signo negativo
    } else {
        totalNeto = totalNetoGan - totalNetoPerd; // pérdidas como valor positivo
    }

    // Formateos defensivos
    const totalNetoGanFmt = totalNetoGan.toFixed(2);
    const totalNetoPerdFmt = totalNetoPerd.toFixed(2);
    const totalNetoFmt = totalNeto.toFixed(2);
    const costoPerdidaFmt = parseFloat(costoPerdida || 0).toFixed(2);
    const gananciaConsecutivaFmt = parseFloat(gananciaConsecutiva || 0).toFixed(2);

    const totalWinLoss = totalGanadoras + totalPerdedoras;
    const winRateDecimal = totalWinLoss > 0 ? totalGanadoras / totalWinLoss : 0;
    const lossRateDecimal = totalWinLoss > 0 ? totalPerdedoras / totalWinLoss : 0;
    const expectancy = (winRateDecimal * avgWin) - (lossRateDecimal * Math.abs(avgLoss));

    const tasaAcierto = totalRealizadas > 0 ? (totalGanadoras / totalRealizadas) * 100 : 0;
    const tasaFracaso = totalRealizadas > 0 ? (totalPerdedoras / totalRealizadas) * 100 : 0;
    const tasaBreakeven = totalRealizadas > 0 ? (totalBreakeven / totalRealizadas) * 100 : 0;

    const capitalMes1 = capitalInicial + mes1.netogan - mes1.netoperd;
    const capitalMes2 = capitalMes1 + mes2.netogan - mes2.netoperd;
    const capitalMes3 = capitalMes2 + mes3.netogan - mes3.netoperd;
    // capitales: array con el equity en orden cronológico (ej: [capitalInicial, capitalMes1, capitalMes2, capitalMes3])
    const capitales = [capitalInicial, capitalMes1, capitalMes2, capitalMes3];

    // cálculo correcto de max drawdown (máxima caída desde un pico hasta su mínimo posterior)
    let runningMax = -Infinity;
    let maxDrawdown = 0;
    let peakAtDrawdown = capitalInicial;
    let troughAtDrawdown = capitalInicial;

 for (let val of capitales) {
    // actualizamos pico si encontramos un nuevo máximo
    if (val > runningMax) runningMax = val;

    // calculamos caída desde el pico actual
    const dd = runningMax - val;

    // ahora registramos la mayor caída, aunque el capital final siga siendo mayor al pico inicial
    if (dd > maxDrawdown) {
        maxDrawdown = dd;
        peakAtDrawdown = runningMax;
        troughAtDrawdown = val;
    }
    }
    
    // pico global (puedes seguir mostrando el pico máximo histórico)
    const picoMaximo = Math.max(...capitales);

    // para mostrar "Capital mínimo después del pico" usamos el trough que produjo el max drawdown
    const capitalMinDespuesPico = troughAtDrawdown;

    // drawdown en dólares y % (usamos peakAtDrawdown como base para %)
    const drawdown = maxDrawdown;
    const drawdownPorcentaje = peakAtDrawdown > 0 ? (drawdown / peakAtDrawdown) * 100 : 0;

    const capitalFinal = capitales[capitales.length - 1];

   
    const crecimientoMaximo = picoMaximo - capitalInicial;
    const crecimientoMaximoPct = capitalInicial > 0 ? (crecimientoMaximo / capitalInicial) * 100 : 0;


    const mesesPorTrimestre = {
        t1: ['Enero', 'Febrero', 'Marzo'],
        t2: ['Abril', 'Mayo', 'Junio'],
        t3: ['Julio', 'Agosto', 'Septiembre'],
        t4: ['Octubre', 'Noviembre', 'Diciembre']
    };
    const meses = mesesPorTrimestre[trimestreValue];

    let erroresHTML = "<h3>Errores cometidos</h3>";
    if (errores.length > 0) {
        erroresHTML += "<ul id='lista-errores'>";
        errores.forEach(err => {
            erroresHTML += `<li><span class="error-tipo">${err.tipo}</span> <span class="error-cantidad">${err.cantidad}</span></li>`;
        });
        erroresHTML += "</ul>";
    } else {
        erroresHTML += "<p>✅ No se registraron errores.</p>";
    }

    let resumen = `
    <div id="resumenTrimestral-content" style="text-align:center;">
        <h2>Análisis Trimestral</h2>
        <div class="meses-container">
            ${meses.map((mes, i) => {
                const m = [mes1, mes2, mes3][i];
                return `<fieldset>
                    <legend>Mes ${i + 1} (${mes})</legend>
                    <b>Operaciones realizadas:</b> ${m.realizadas}<br>
                    <b>Ganadoras:</b> ${m.ganadoras}<br>
                    <b>Perdedoras:</b> ${m.perdedoras}<br>
                    <b>Breakeven:</b> ${m.breakeven}<br>
                    <b>Neto ganancias:</b> ${m.netogan}<br>
                    <b>Neto perdidas:</b> ${m.netoperd}<br>
                </fieldset>`;
            }).join('')}
        </div>
        <div class="datos-generales">
            <table class="resumen-metricas">
                <tr><th>Métrica</th><th>Valor</th></tr>
                <tr><td>operaciones realizadas</td><td>${totalRealizadas}</td></tr>
                <tr><td>operaciones ganadoras</td><td>${totalGanadoras}</td></tr>
                <tr><td>operaciones perdedoras</td><td>${totalPerdedoras}</td></tr>
                <tr><td>operaciones en breakeven</td><td>${totalBreakeven}</td></tr>
                <tr><td>neto de las ganancias</td><td class="valor-positivo">$${totalNetoGanFmt}</td></tr>
                <tr><td>neto de las perdidas</td><td class="valor-negativo">$${totalNetoPerdFmt}</td></tr>
                <tr><td><b>Total neto</b></td>
                    <td class="${totalNeto >= 0 ? 'valor-positivo' : 'valor-negativo'}"><b>$${totalNetoFmt}</b></td>
                </tr>
                <tr><td>Tasa de acierto</td><td>${tasaAcierto.toFixed(2)}%</td></tr>
                <tr><td>Tasa de fracaso</td><td>${tasaFracaso.toFixed(2)}%</td></tr>
                <tr><td>Tasa breakeven</td><td>${tasaBreakeven.toFixed(2)}%</td></tr>
                <tr><td>Avg Win</td><td>${avgWin.toFixed(2)}</td></tr>
                <tr><td>Avg Loss</td><td>${avgLoss.toFixed(2)}</td></tr>
                <tr><td>Ratio</td><td>${ratio.toFixed(2)}</td></tr>
                <tr><td>Expectativa</td><td>${expectancy.toFixed(2)}</td></tr>
                <tr><td>💰 Capital inicial</td><td>$${capitalInicial.toFixed(2)}</td></tr>
                <tr><td>📊 Pico usado para calcular el drawdown</td><td>$${peakAtDrawdown.toFixed(2)}</td></tr>
                <tr><td>📉 Capital mínimo después del pico</td><td>$${capitalMinDespuesPico.toFixed(2)}</td></tr>
                <tr><td>🛑 Drawdown en dólares</td><td>$${drawdown.toFixed(2)}</td></tr>
                <tr><td>🛑 Drawdown en porcentaje</td><td>${drawdownPorcentaje.toFixed(2)}%</td></tr>
                <tr><td>📈 Pico máximo</td><td>$${picoMaximo.toFixed(2)}</td></tr>
                <tr><td>💵 Capital final</td><td>$${capitalFinal.toFixed(2)}</td></tr>
                <tr><td>📈 Crecimiento máximo respecto al capital inicial</td><td>$${crecimientoMaximo.toFixed(2)} (${crecimientoMaximoPct.toFixed(2)}%)</td></tr>
                <tr><td>Mayor Racha de operaciones pérdidas consecutivas</td><td>${rachaPerdidas}</td></tr>
                <tr><td>Costo total neto de la pérdida consecutiva</td><td class="valor-negativo">$${costoPerdidaFmt}</td></tr>
                <tr><td>Mayor Racha de operaciones ganadas consecutivas</td><td>${rachaGanancias}</td></tr>
                <tr><td>Ganancia total neta de la ganancia consecutiva</td><td class="valor-positivo">$${gananciaConsecutivaFmt}</td></tr>
            </table>
        </div>
        ${erroresHTML}
    </div>
    `;

    const resumenDiv = document.getElementById('resumenTrimestral');
    if (resumenDiv) {
        resumenDiv.innerHTML = resumen;
        resumenDiv.style.display = 'block';
    }
}

// Funciones de agregar y mostrar errores
function agregarError() {
    const select = document.getElementById('tipo-error');
    const tipoError = select?.options[select.selectedIndex]?.text || '';
    const cantidadError = safeParseInt(document.getElementById('cantidad-error')?.value);

    if (!cantidadError || cantidadError <= 0) {
        alert("⚠️ Ingresa una cantidad válida de errores.");
        return;
    }

    const existente = errores.find(err => err.tipo === tipoError);
    if (existente) {
        existente.cantidad += cantidadError;
    } else {
        errores.push({ tipo: tipoError, cantidad: cantidadError });
    }

    mostrarErrores();
}

function mostrarErrores() {
    const lista = document.getElementById('lista-errores');
    if (!lista) return;
    lista.innerHTML = "";
    errores.forEach(err => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="error-tipo">${err.tipo}</span> <span class="error-cantidad">${err.cantidad}</span>`;
        lista.appendChild(li);
    });
}

// Event listeners para cambio de trimestre y exportar
document.addEventListener('DOMContentLoaded', () => {
    const selectTrimestre = document.getElementById('trimestre-select');
    const fieldsets = document.querySelectorAll('.meses-container fieldset');

    selectTrimestre?.addEventListener('change', () => {
        const value = selectTrimestre.value;
        const mesesPorTrimestre = {
            t1: ['Enero','Febrero','Marzo'],
            t2: ['Abril','Mayo','Junio'],
            t3: ['Julio','Agosto','Septiembre'],
            t4: ['Octubre','Noviembre','Diciembre']
        };
        const meses = mesesPorTrimestre[value];
        fieldsets.forEach((fs, i) => {
            fs.querySelector('legend').textContent = `Mes ${i + 1} (${meses[i]})`;
        });
    });

    document.getElementById('btnExportarImagen')?.addEventListener('click', () => {
        const resumen = document.getElementById('resumenTrimestral');
        if (!resumen) return;

        html2canvas(resumen, { backgroundColor: null }).then(canvas => {
            const link = document.createElement('a');
            link.download = `resumen_trimestral.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    });
});

