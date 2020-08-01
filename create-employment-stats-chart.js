function createEmploymentChart(data) {

    data.forEach(function (d) { // Make every date in the csv data a javascript date object format
        d.date = parseDate(d.date);
    });

    data.dates = data.map(function (d) {
        return d.date;
    });
    data.values = data.map(function (d) {
        return data.columns.slice(1).map(function (c) {
            return parseFloat(d[c]);
        });
    });

    // A color scale: one color for each group
    var myColor = d3.scaleOrdinal()
        .domain(data.columns.slice(1))
        .range(["#54b7b1", "#f3935c", "#d6c33d", "#eeb096", "#AAB75B", "#3D7FA7", "#b375b7", "#7873b7", "#4eb77a", "#F2D75E", "#e17d88", "#5ab7a5"]);

    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, margin.left + width]);

    var xAxis = svg1.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (margin.top + height) + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([d3.min(data.values.map(d => d3.min(d))), d3.max(data.values.map(d => d3.max(d)))])
        .nice()
        .range([margin.top + height, margin.top]);

    var yAxis = svg1.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(y));
    yAxis.append("text")
        .attr("dy", ".75em")
        .attr("x", 153)
        .attr("y", 45)
        .style("text-anchor", "end")
        .text("All Employees, Thousands");

    // Add a clipPath: everything out of this area won't be drawn.
    svg1.append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", margin.left)
        .attr("y", margin.top);

    // Brushing function
    var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent([[margin.left, margin.top], [margin.left + width, margin.top + height]])  // initialise the brush area
        .on("end", updateChart);               // Each time the brush selection changes, trigger the 'updateChart' function

    // Only check Total nonfarm checkbox
    d3.selectAll(".checkbox").each(function (d) {
        var cb = d3.select(this);
        if (cb.property("value") === "Total nonfarm") {
            cb.property('checked', true);
        } else {
            cb.property('checked', false);
        }
    });

    // Line function
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.population));

    // Initialize line with group Total nonfarm
    var selectedData = [{
        column: "Total nonfarm",
        values: data.map(function (d) {
            return {
                date: d.date,
                population: d["Total nonfarm"]
            };
        })
    }];

    var clip = svg1.append('g')
        .attr("clip-path", "url(#clip)");

    var path = clip.selectAll("lines")
        .data(selectedData)
        .enter()
        .append("path")
        .attr("class", "lines")
        .attr("d", d => line(d.values))
        .attr("stroke", myColor("Total nonfarm"))
        .style("stroke-width", 2)
        .style("fill", "none");

    svg1.append("text")
        .attr("class", "line_label")
        .attr("transform", "translate(" + (x(data[data.length - 1].date) + 4) + ","
            + (y(data[data.length - 1]["Total nonfarm"]) + 5) + ")")
        .attr("x", 3)
        .text("Total nonfarm")
        .attr("fill", myColor("Total nonfarm"));

    // Add the brushing
    clip.append("g")
        .attr("class", "brush")
        .call(brush);

    // Add the annotation
    svg1.append("line")
        .attr("class", "annotation")
        .attr("x1", x(parseDate("Apr-2020")))
        .attr("y1", margin.top + height)
        .attr("x2", x(parseDate("Apr-2020")))
        .attr("y2", margin.top);

    svg1.append("text")
        .attr("class", "annotation_label")
        .attr("x", x(parseDate("Apr-2020")) + 24)
        .attr("y", margin.top - 4)
        .text("Apr-2020");

    // Add the legend
    var dots = svg1.selectAll("dots")
        .data(data.columns.slice(1))
        .enter();
    dots.append("circle")
        .attr("class", "dots")
        .attr("cx", margin.left + width + 246)
        .attr("cy", function (d, i) {
            return margin.top + 18 + i * 20
        })
        .attr("r", 4)
        .style("fill", d => myColor(d));

    dots.append("text")
        .attr("class", "legend")
        .attr("x", margin.left + width + 254)
        .attr("y", function (d, i) {
            return margin.top + 20 + i * 20
        })
        .text(d => d)
        .style("alignment-baseline", "middle")
        .style("fill", d => myColor(d));

    dots.append("rect")
        .attr("class", "legend_rect")
        .attr("x", margin.left + width + 235)
        .attr("y", margin.top + 2)
        .attr("width", 250)
        .attr("height", 228);

    svg1.call(hover, path, selectedData);

    // A function that set idleTimeOut to null
    var idleTimeout;

    function idled() {
        idleTimeout = null;
    }

    function resetChart() {
        x.domain(d3.extent(data, d => d.date));
        xAxis.transition().call(d3.axisBottom(x));
        path.transition()
            .attr("d", d => line(d.values));
        d3.selectAll(".line_label").transition().style("opacity", 1);
        d3.selectAll(".annotation").transition().style("opacity", 1);
        d3.selectAll(".annotation_label").transition().style("opacity", 1);
    }

    // If user double click, reinitialize the chart
    svg1.on("dblclick", resetChart);

    // A function that update the chart for given boundaries
    function updateChart() {

        // What are the selected boundaries?
        var extent = d3.event.selection;
        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!extent) {
            if (!idleTimeout) {
                return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            }
        } else {
            x.domain([x.invert(extent[0]), x.invert(extent[1])]);
            clip.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
        }

        // Update axis and line position
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
        path.transition()
            .duration(1000)
            .attr("d", d => line(d.values));
        d3.selectAll(".line_label").transition().duration(1000).style("opacity", 0);
        d3.selectAll(".annotation").transition().duration(1000).style("opacity", 0);
        d3.selectAll(".annotation_label").transition().duration(1000).style("opacity", 0);
    }

    // A function that update the chart
    function update() {

        resetChart();
        d3.selectAll(".lines").remove();
        d3.selectAll(".line_label").remove();

        var selectedChoices = [];
        d3.selectAll(".checkbox").each(function (d) {
            var cb = d3.select(this);
            if (cb.property("checked")) {
                selectedChoices.push(cb.property("value"));
            }
        });
        var minY = 100000, maxY = 0;
        // run the updateChart function with selected choices
        selectedData = selectedChoices.map(function (c) {
            return {
                column: c,
                values: data.map(function (d) {
                    var pop = parseFloat(d[c]);
                    minY = pop < minY ? pop : minY;
                    maxY = pop > maxY ? pop : maxY;
                    return {
                        date: d.date,
                        population: pop
                    };
                })
            };
        });
        if (minY > maxY) {
            minY = d3.min(data.values.map(d => d3.min(d)));
            maxY = d3.max(data.values.map(d => d3.max(d)));
        }

        // Update Y axis
        y.domain([minY, maxY]).nice();
        yAxis.transition().call(d3.axisLeft(y));

        clip = svg1.append('g')
            .attr("clip-path", "url(#clip)");

        path = clip.selectAll("lines")
            .data(selectedData)
            .enter()
            .append("path")
            .attr("class", "lines")
            .attr("d", d => line(d.values))
            .attr("stroke", d => myColor(d.column))
            .style("stroke-width", 2)
            .style("fill", "none");

        var lines = svg1.selectAll("lines")
            .data(selectedData)
            .enter();
        lines.append("text")
            .attr("class", "line_label")
            .datum(function (d) {
                return {
                    column: d.column,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function (d) {
                return "translate(" + (x(d.value.date) + 4) + "," + (y(d.value.population) + 5) + ")";
            })
            .attr("x", 3)
            .text(d => d.column)
            .attr("fill", d => myColor(d.column));

        // Add the brushing
        clip.append("g")
            .attr("class", "brush")
            .call(brush);

        svg1.call(hover, path, selectedData);
    }

    // When the checkbox is changed, run the updateChart function
    d3.selectAll(".checkbox").on("change", update);

    function hover(svg, path, selectedData) {

        if ("ontouchstart" in document) {
            svg.style("-webkit-tap-highlight-color", "transparent")
                .on("touchmove", moved)
                .on("touchstart", entered)
                .on("touchend", left);
        } else {
            svg.on("mousemove", moved)
                .on("mouseenter", entered)
                .on("mouseleave", left);
        }

        const dot = svg.append("g")
            .attr("display", "none");

        dot.append("circle")
            .attr("r", 2.5);

        function moved() {
            d3.event.preventDefault();
            const mouse = d3.mouse(this);
            const xm = x.invert(mouse[0]);
            const ym = y.invert(mouse[1]);
            const i1 = d3.bisectLeft(data.dates, xm, 1);
            const i0 = i1 - 1;
            const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
            const s = d3.least(selectedData, d => Math.abs(d.values[i].population - ym));
            path.attr("stroke", d => d === s ? myColor(s.column) : "#ddd").filter(d => d === s).raise();
            dot.selectAll("text").remove();
            dot.attr("transform", `translate(${x(data.dates[i])},${y(s.values[i].population)})`)
                .style('fill', myColor(s.column));
            dot.append("text")
                .attr("class", "dot_label")
                .attr("dy", "0em")
                .attr("x", 4)
                .attr("y", -22)
                .text(formatDate(data.dates[i]));
            dot.append("text")
                .attr("class", "dot_label")
                .attr("dy", "1em")
                .attr("x", 4)
                .attr("y", -22)
                .text(s.values[i].population);
        }

        function entered() {
            path.style("mix-blend-mode", null).attr("stroke", "#ddd");
            dot.attr("display", null);
        }

        function left() {
            path.style("mix-blend-mode", "multiply").attr("stroke", d => {
                console.log(d.column);
                return myColor(d.column);
            });
            dot.attr("display", "none");
        }
    }

}