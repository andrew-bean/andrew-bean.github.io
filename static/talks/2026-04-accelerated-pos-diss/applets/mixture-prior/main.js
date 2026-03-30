/**
 * Simplified Prior-Only Applet
 *
 * Shows a single panel: the benchmark-calibrated mixture prior.
 * Inputs: TPP, benchmark PoS, standard trial series, calibrate button.
 */

import { normalPDF, mixturePDF } from './bayesianStats.js';
import { Calibration } from './calibration.js';

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

const state = {
    mu1: 0,               // null component mean (fixed)
    mu2: 2,               // TPP component mean (= TPP)
    priorSD: 2 / 2.326,   // SD such that P(X > mu2 | mu1, sd) ≈ 0.01
    mixtureWeight: 0.5,    // null-component weight (set by calibration)
};

function recalcSD() {
    state.priorSD = state.mu2 / 2.326;   // keep 1 % tail beyond mu2
}

/* ------------------------------------------------------------------ */
/*  Calibration                                                        */
/* ------------------------------------------------------------------ */

const cal = new Calibration();
let isCalibrated = false;
let lastCalParams = null;

function calParamsKey() {
    return JSON.stringify({
        mu2: state.mu2,
        bench: cal.benchmarkProb,
        ts: cal.trialSeries,
    });
}

function invalidateCalibration() {
    isCalibrated = false;
    updateCalibrationUI();
}

function updateCalibrationUI() {
    const btn = d3.select('#calibrate-btn');
    const box = d3.select('#calibration-info');
    if (isCalibrated) {
        btn.style('background', '#888888').style('cursor', 'default')
           .classed('calibrated', true);
        // info box already set by handleCalibrate
    } else {
        btn.style('background', '#ff4e00').style('cursor', 'pointer')
           .classed('calibrated', false);
        box.html(`
            <span style="font-size:18px;">&#x274C;</span>
            <div><em><strong>Status:</strong> Not calibrated<br>
            <small>Click button to calibrate to benchmark</small></em></div>
        `);
    }
}

function handleCalibrate() {
    if (isCalibrated) return;
    const btn = d3.select('#calibrate-btn');
    btn.property('disabled', true).text('Calibrating…');
    setTimeout(() => {
        const res = cal.calibrate(state.mu2, state.priorSD);
        state.mixtureWeight = res.weight;
        lastCalParams = calParamsKey();
        isCalibrated = true;

        const tppW = 1 - res.weight;
        const phases = res.params.includedTrials.map(t => t.phase).join(', ');
        d3.select('#calibration-info').html(`
            <span style="font-size:18px;">&#x2705;</span>
            <div>
                <strong>Calibrated</strong><br>
                <strong>Weight on TPP:</strong> ${tppW.toFixed(3)}<br>
                <strong>Benchmark:</strong> ${(res.benchmark * 100).toFixed(1)}%
                (Achieved: ${(res.probability * 100).toFixed(1)}%)<br>
                <small>Trials: ${phases} | ${res.elapsed.toFixed(0)} ms</small>
            </div>
        `);
        updateCalibrationUI();
        btn.property('disabled', false).text('Calibrate Prior to Benchmark');
        drawChart();
    }, 30);
}

/* ------------------------------------------------------------------ */
/*  D3 Chart – Panel 1 (prior)                                        */
/* ------------------------------------------------------------------ */

let svg, gChart, xScale, yScale, chartW, chartH;
const margin = { top: 12, right: 24, bottom: 44, left: 54 };

function initChart() {
    const container = document.querySelector('.chart-container');
    const rect = container.getBoundingClientRect();
    chartW = rect.width - margin.left - margin.right;
    chartH = rect.height - margin.top - margin.bottom;

    svg = d3.select('#prior-chart');
    gChart = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    xScale = d3.scaleLinear().range([0, chartW]);
    yScale = d3.scaleLinear().range([chartH, 0]);
}

function drawChart() {
    gChart.selectAll('*').remove();

    // Data
    const xMin = state.mu1 - 4 * state.priorSD;
    const xMax = state.mu2 + 4 * state.priorSD;
    const data = d3.range(xMin, xMax, (xMax - xMin) / 300).map(x => ({
        x,
        mix: mixturePDF(x, state.mixtureWeight, state.mu1, state.mu2, state.priorSD, state.priorSD),
        c1: normalPDF(x, state.mu1, state.priorSD),
        c2: normalPDF(x, state.mu2, state.priorSD),
    }));

    const yMax = d3.max(data, d => Math.max(d.mix, d.c1, d.c2)) * 1.12;
    xScale.domain([xMin, xMax]);
    yScale.domain([0, yMax]);

    // Grid
    gChart.append('g').attr('class', 'grid')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(xScale).tickSize(-chartH).tickFormat(''));
    gChart.append('g').attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-chartW).tickFormat(''));

    // Area + line helpers
    const area = d3.area().x(d => xScale(d.x)).y0(chartH);
    const line = d3.line().x(d => xScale(d.x));

    // Mixture fill + stroke
    gChart.append('path').datum(data)
        .attr('class', 'density-area')
        .attr('d', area.y1(d => yScale(d.mix)))
        .attr('fill', '#161616');
    gChart.append('path').datum(data)
        .attr('class', 'density-line')
        .attr('d', line.y(d => yScale(d.mix)))
        .attr('stroke', '#161616');

    // Component 1 (null) — dashed
    gChart.append('path').datum(data)
        .attr('class', 'density-line')
        .attr('d', line.y(d => yScale(d.c1)))
        .attr('stroke', '#888888').attr('opacity', 0.6)
        .attr('stroke-dasharray', '5,4');

    // Component 2 (TPP) — dashed
    gChart.append('path').datum(data)
        .attr('class', 'density-line')
        .attr('d', line.y(d => yScale(d.c2)))
        .attr('stroke', '#ff4e00').attr('opacity', 0.6)
        .attr('stroke-dasharray', '5,4');

    // TPP reference line
    gChart.append('line')
        .attr('x1', xScale(state.mu2)).attr('x2', xScale(state.mu2))
        .attr('y1', yScale(0)).attr('y2', yScale(yMax))
        .attr('stroke', '#ff4e00').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,3');
    gChart.append('text')
        .attr('x', xScale(state.mu2) + 5).attr('y', yScale(yMax) + 14)
        .style('font-size', '12px').attr('fill', '#ff4e00')
        .text('TPP');

    // Zero reference
    if (xMin < 0) {
        gChart.append('line')
            .attr('x1', xScale(0)).attr('x2', xScale(0))
            .attr('y1', yScale(0)).attr('y2', yScale(yMax))
            .attr('stroke', '#999').attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,3');
        gChart.append('text')
            .attr('x', xScale(0) + 4).attr('y', yScale(yMax) + 14)
            .style('font-size', '11px').attr('fill', '#999')
            .text('H₀');
    }

    // Axes
    gChart.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(xScale));
    gChart.append('g').attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(''));

    // X-axis label
    gChart.append('text')
        .attr('x', chartW / 2).attr('y', chartH + 38)
        .style('text-anchor', 'middle').style('font-size', '13px')
        .text('Treatment Effect');

    // Legend
    d3.select('#chart-legend').html(`
        <span style="display:inline-flex;align-items:center;gap:5px;margin-right:16px;">
            <span style="display:inline-block;width:18px;height:3px;background:#161616;border-radius:1px;"></span>
            <span>Mixture prior</span>
        </span>
        <span style="display:inline-flex;align-items:center;gap:5px;margin-right:16px;">
            <span style="display:inline-block;width:18px;height:0;border-top:2px dashed #888888;"></span>
            <span>Null component</span>
        </span>
        <span style="display:inline-flex;align-items:center;gap:5px;">
            <span style="display:inline-block;width:18px;height:0;border-top:2px dashed #ff4e00;"></span>
            <span>TPP component</span>
        </span>
    `);
}

/* ------------------------------------------------------------------ */
/*  Event wiring                                                       */
/* ------------------------------------------------------------------ */

function setupEvents() {
    // Benchmark slider
    d3.select('#benchmark-prob').on('input', function () {
        const v = +this.value;
        d3.select('#benchmark-prob-value').text((v * 100).toFixed(1) + '%');
        cal.benchmarkProb = v;
        invalidateCalibration();
    });

    // Trial series table — include checkboxes
    d3.selectAll('.trial-include').on('change', function () {
        const idx = +this.closest('tr').dataset.trialIndex;
        cal.updateTrialSeries([{ index: idx, field: 'included', value: this.checked }]);
        invalidateCalibration();
    });

    // Trial series table — alpha
    d3.selectAll('.trial-alpha').on('change', function () {
        const idx = +this.closest('tr').dataset.trialIndex;
        cal.updateTrialSeries([{ index: idx, field: 'alpha', value: +this.value }]);
        invalidateCalibration();
    });

    // Trial series table — beta (power)
    d3.selectAll('.trial-beta').on('change', function () {
        const idx = +this.closest('tr').dataset.trialIndex;
        cal.updateTrialSeries([{ index: idx, field: 'beta', value: +this.value }]);
        invalidateCalibration();
    });

    // Calibrate button
    d3.select('#calibrate-btn').on('click', handleCalibrate);

    // Collapsible toggle
    d3.select('#trial-series-toggle').on('click', () => {
        const tog = d3.select('#trial-series-toggle');
        const con = d3.select('#trial-series-content');
        const wasCollapsed = tog.classed('collapsed');
        tog.classed('collapsed', !wasCollapsed);
        con.classed('collapsed', !wasCollapsed);
        con.classed('expanded', wasCollapsed);
    });

    // Resize handler
    window.addEventListener('resize', () => {
        const rect = document.querySelector('.chart-container').getBoundingClientRect();
        chartW = rect.width - margin.left - margin.right;
        chartH = rect.height - margin.top - margin.bottom;
        xScale.range([0, chartW]);
        yScale.range([chartH, 0]);
        drawChart();
    });
}

/* ------------------------------------------------------------------ */
/*  Bootstrap                                                          */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
    recalcSD();
    initChart();
    setupEvents();
    updateCalibrationUI();
    drawChart();
    console.log('✅ Mixture-prior applet ready');
});
