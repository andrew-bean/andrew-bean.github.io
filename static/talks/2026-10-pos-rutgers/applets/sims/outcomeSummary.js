/**
 * Outcome Summary Panel
 *
 * Renders the final program-level outcome grid using the exact same SVG
 * canvas, grid geometry and `.program-rect` elements as the animated steps
 * (Step0FloatAndGrid / Step18ReorderByOutcome), so it can be shown first and
 * then reused (not rebuilt) when the user clicks Next into the step flow.
 */

// Best -> worst, matching Step18ReorderByOutcome's ordering.
const CATEGORIES = [
    { key: 'tpp_success', label: 'TPP achieved (full success)', colorKey: 'tppSuccess' },
    { key: 'significant', label: 'Significant, below TPP', colorKey: 'significant' },
    { key: 'regulatory', label: 'Regulatory failure', colorKey: 'regulatoryFailure' },
    { key: 'safety', label: 'Safety failure', colorKey: 'safetyFailure' },
    { key: 'efficacy', label: 'Efficacy failure', colorKey: 'efficacyFailure' }
];

function categorize(programs) {
    return {
        tpp_success: programs.filter(p => p.outcomeCategory === 'tpp_success' && !p.safetyFailed && !p.regulatoryFailed),
        significant: programs.filter(p => p.outcomeCategory === 'significant' && !p.safetyFailed && !p.regulatoryFailed),
        regulatory: programs.filter(p => p.regulatoryFailed),
        safety: programs.filter(p => p.safetyFailed && !p.regulatoryFailed),
        efficacy: programs.filter(p => p.outcomeCategory === 'efficacy_failure')
    };
}

/**
 * Grid geometry identical to Step18ReorderByOutcome.assignNewPositions():
 * columnwise (top-to-bottom, left-to-right), centered in the shared canvas.
 */
function assignGridPositions(orderedPrograms, config) {
    const nPrograms = orderedPrograms.length;
    const cols = config.grid.cols;
    const rows = config.grid.getRows(nPrograms);
    const cellSize = config.rectSize + config.spacing;
    const gridWidth = cols * cellSize - config.spacing;
    const gridHeight = rows * cellSize - config.spacing;
    const startX = (config.width - gridWidth) / 2;
    const startY = (config.height - gridHeight) / 2;

    orderedPrograms.forEach((program, i) => {
        const col = Math.floor(i / rows);
        const row = i % rows;
        program.outcomePosition = {
            x: startX + col * cellSize + config.rectSize / 2,
            y: startY + row * cellSize + config.rectSize / 2
        };
    });
}

/**
 * @param {d3.Selection} container - Empty element to render into
 * @param {Array} programs - this.data.programs, already categorized
 * @param {Object} config - full visualization config (colors, dimensions, grid)
 * @returns {d3.Selection} the created <svg> selection (reused by the step flow)
 */
export function renderOutcomeSummary(container, programs, config) {
    container.selectAll("*").remove();

    const groups = categorize(programs);
    const colors = config.colors;

    const orderedPrograms = [];
    CATEGORIES.forEach(cat => orderedPrograms.push(...groups[cat.key]));
    assignGridPositions(orderedPrograms, config);

    // Cache each program's outcome color/label so the step flow can restore
    // them later (e.g. animating back from step 0 to this summary).
    CATEGORIES.forEach(cat => {
        groups[cat.key].forEach(p => {
            p.outcomeColor = colors[cat.colorKey];
            p.outcomeLabel = cat.label;
        });
    });

    const svg = container.append("svg")
        .attr("width", config.width)
        .attr("height", config.height);

    svg.selectAll(".program-rect")
        .data(orderedPrograms)
        .enter()
        .append("rect")
        .attr("class", "program-rect")
        .attr("width", config.rectSize)
        .attr("height", config.rectSize)
        .attr("x", d => d.outcomePosition.x - config.rectSize / 2)
        .attr("y", d => d.outcomePosition.y - config.rectSize / 2)
        .style("fill", d => d.outcomeColor)
        .append("title")
        .text(d => d.outcomeLabel);

    renderLegend(container, programs, colors);

    return svg;
}

/**
 * Legend list (colour swatch + label + %), extracted so it can be rebuilt
 * on its own when the step flow shuffles back into the summary.
 */
export function renderLegend(container, programs, colors) {
    const groups = categorize(programs);
    const total = programs.length;

    const legend = container.append("ul")
        .style("list-style", "none")
        .style("margin", "12px 0 0")
        .style("padding", "0")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("justify-content", "center")
        .style("gap", "6px 18px");

    CATEGORIES.forEach(cat => {
        const count = groups[cat.key].length;
        if (count === 0) return;

        const item = legend.append("li")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "8px")
            .style("font-size", "12px");

        item.append("span")
            .style("display", "inline-block")
            .style("width", "12px")
            .style("height", "12px")
            .style("border-radius", "2px")
            .style("flex", "0 0 auto")
            .style("background-color", colors[cat.colorKey]);

        item.append("span")
            .style("color", "#3f3f3f")
            .text(cat.label);

        item.append("span")
            .style("font-variant-numeric", "tabular-nums")
            .style("color", "#6b7280")
            .text(`${Math.round((count / total) * 100)}%`);
    });

    return legend;
}
