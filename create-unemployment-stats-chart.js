function createUnemploymentChart(data) {

    // List of groups
    const allGroups = ["---", "Education", "Race", "Sex"];
    // Map group to corresponding columns
    const groupToColumns = {
        "---": ["16 years and over"],
        "Education": ["25 years and over - Less than a High School diploma", "25 years and over - High School graduates, no college", "25 years and over - Some college or associate degree", "25 years and over - Bachelor's degree and higher"],
        "Race": ["16 years and over - Asian", "16 years and over - Black or African American", "16 years and over - Hispanic or Latino", "16 years and over - White"],
        "Sex": ["20 years and over - Men", "20 years and over - Women"]
    };

    // add the options to the button
    d3.select("#selectButton")
        .attr("class", "button")
        .selectAll('myOptions')
        .data(allGroups)
        .enter()
        .append('option')
        .text(d => d) // text showed in the menu
        .attr("value", d => d); // corresponding value returned by the button

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
        .range(["#54b7b1", "#f3935c", "#d6c33d", "#eeb096", "#AAB75B", "#4886a7", "#b375b7", "#9e7ab7", "#4eb77a", "#F2D75E", "#e17d88", "#5ab7a5"]);

    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, margin.left + width]);

    var xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (margin.top + height) + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data.values.map(d => d3.max(d)))])
        .nice()
        .range([margin.top + height, margin.top]);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("dy", ".75em")
        .attr("x", 135)
        .attr("y", 45)
        .style("text-anchor", "end")
        .text("Unemployment Rate %");

    // Add a clipPath: everything out of this area won't be drawn.
    svg.append("defs")
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

    // Line function
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.rate));

    // Initialize line with group 16 years and over
    var selectedData = [{
        column: "16 years and over",
        values: data.map(function (d) {
            return {
                date: d.date,
                rate: d["16 years and over"]
            };
        })
    }];

    var clip = svg.append('g')
        .attr("clip-path", "url(#clip)");

    var path = clip.selectAll("lines")
        .data(selectedData)
        .enter()
        .append("path")
        .attr("class", "lines")
        .attr("d", d => line(d.values))
        .attr("stroke", myColor("16 years and over"))
        .style("stroke-width", 2)
        .style("fill", "none");

    svg.append("text")
        .attr("class", "line_label")
        .attr("transform", "translate(" + (x(data[data.length - 1].date) + 4) + ","
            + (y(data[data.length - 1]["16 years and over"]) + 5) + ")")
        .attr("x", 5)
        .text("16 years and over")
        .attr("fill", myColor("16 years and over"));

    // Add the brushing
    clip.append("g")
        .attr("class", "brush")
        .call(brush);

    function findMaxData(data) {
        var values = data.values.reverse().map(d => parseFloat(d.rate));
        var maxIndex = data.values.length - 1 - d3.maxIndex(values);
        data.values.reverse();
        return [data.values[maxIndex].date, data.values[maxIndex].rate];
    }

    var maxData = findMaxData(selectedData[0]);

    // Add the annotation
    svg.append("line")
        .attr("class", "annotation")
        .attr("x1", x(maxData[0]))
        .attr("y1", y(maxData[1]))
        .attr("x2", x(maxData[0]) - 35)
        .attr("y2", y(maxData[1]) - 35);

    svg.append("text")
        .attr("class", "annotation_label")
        .attr("dy", "0em")
        .attr("x", x(maxData[0]) - 38)
        .attr("y", y(maxData[1]) - 38)
        .text(formatDate(maxData[0]));

    svg.append("text")
        .attr("class", "annotation_label")
        .attr("dy", "0.75em")
        .attr("x", x(maxData[0]) - 38)
        .attr("y", y(maxData[1]) - 38)
        .text(maxData[1]);

    // Add the legend
    svg.append("circle")
        .attr("class", "dots")
        .attr("cx", margin.left + width + 72)
        .attr("cy", margin.top + 14)
        .attr("r", 4)
        .style("fill", myColor("16 years and over"));

    svg.append("text")
        .attr("class", "legend")
        .attr("x", margin.left + width + 80)
        .attr("y", margin.top + 16)
        .text("16 years and over")
        .style("alignment-baseline", "middle")
        .style("fill", myColor("16 years and over"));

    svg.append("rect")
        .attr("class", "legend_rect")
        .attr("x", margin.left + width + 62)
        .attr("y", margin.top - 2)
        .attr("width", 141)
        .attr("height", 28);

    svg.call(hover, path, selectedData);

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
    svg.on("dblclick", resetChart);

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
    function update(selectedOption) {
        resetChart();

        const selectedColumns = groupToColumns[selectedOption];
        selectedData = selectedColumns.map(function (c) {
            return {
                column: c,
                values: data.map(function (d) {
                    return {
                        date: d.date,
                        rate: d[c]
                    };
                })
            };
        });

        d3.selectAll(".lines").remove();
        d3.selectAll(".line_label").remove();
        d3.selectAll(".dots").remove();
        d3.selectAll(".legend").remove();
        d3.selectAll(".legend_rect").remove();
        d3.selectAll(".annotation").remove();
        d3.selectAll(".annotation_label").remove();

        clip = svg.append('g')
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

        var lines = svg.selectAll("lines")
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
                return "translate(" + (x(d.value.date) + 4) + "," + (y(d.value.rate) + 5) + ")";
            })
            .attr("x", 5)
            .text(d => d.column)
            .attr("fill", d => myColor(d.column));

        // Add the annotation
        lines = lines.datum(d => findMaxData(d));
        lines.append("line")
            .attr("class", "annotation")
            .attr("x1", d => x(d[0]))
            .attr("y1", d => y(d[1]))
            .attr("x2", d => x(d[0]) - 35)
            .attr("y2", d => y(d[1]) - 35);

        lines.append("text")
            .attr("class", "annotation_label")
            .attr("dy", "0em")
            .attr("x", d => x(d[0]) - 38)
            .attr("y", d => y(d[1]) - 38)
            .text(d => formatDate(d[0]));

        lines.append("text")
            .attr("class", "annotation_label")
            .attr("dy", "0.75em")
            .attr("x", d => x(d[0]) - 38)
            .attr("y", d => y(d[1]) - 38)
            .text(d => d[1]);

        // Add the legend
        var dots = svg.selectAll("dots")
            .data(selectedData)
            .enter();
        dots.append("circle")
            .attr("class", "dots")
            .attr("cx", margin.left + width + 72)
            .attr("cy", function (d, i) {
                return margin.top + 14 + i * 20
            })
            .attr("r", 4)
            .style("fill", d => myColor(d.column));

        dots.append("text")
            .attr("class", "legend")
            .attr("x", margin.left + width + 80)
            .attr("y", function (d, i) {
                return margin.top + 16 + i * 20
            })
            .text(d => d.column)
            .style("alignment-baseline", "middle")
            .style("fill", d => myColor(d.column));

        dots.append("rect")
            .attr("class", "legend_rect")
            .attr("x", margin.left + width + 62)
            .attr("y", margin.top - 2)
            .attr("width", function (d) {
                if (selectedOption === "---")
                    return 141;
                else if (selectedOption === "Education")
                    return 373;
                else if (selectedOption === "Race")
                    return 324;
                else
                    return 208;
            }).attr("height", function (d) {
            if (selectedOption === "---")
                return 28;
            else if (selectedOption === "Education" || selectedOption === "Race")
                return 87;
            else
                return 46;
        });

        // Add the brushing
        clip.append("g")
            .attr("class", "brush")
            .call(brush);

        svg.call(hover, path, selectedData);
    }

    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function (d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value");
        // run the updateChart function with this selected option
        update(selectedOption);
    });

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

        dot.append("text")
            .attr("class", "line_label")
            .attr("x", 4);

        function moved() {
            d3.event.preventDefault();
            const mouse = d3.mouse(this);
            const xm = x.invert(mouse[0]);
            const ym = y.invert(mouse[1]);
            const i1 = d3.bisectLeft(data.dates, xm, 1);
            const i0 = i1 - 1;
            const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
            const s = d3.least(selectedData, d => Math.abs(d.values[i].rate - ym));
            path.attr("stroke", d => d === s ? myColor(s.column) : "#ddd").filter(d => d === s).raise();
            dot.selectAll("text").remove();
            dot.attr("transform", `translate(${x(data.dates[i])},${y(s.values[i].rate)})`)
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
                .text(s.values[i].rate);
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