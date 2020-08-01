function createLaborProductivityChart(data) {

    // Map slider choice to corresponding column
    const choiceToColumn = {
        "0": "Business",
        "1": "Nonfarm Business",
        "2": "Manufacturing",
    };
    data.forEach(function (d) { // Make every date in the csv data a javascript date object format
        var parts = d.date.split("-");
        var month = parseInt(parts[0]) * 3 - 2;
        d.date = parseDate1(month + "-" + parts[1]);
    });

    data.dates = data.map(function (d) {
        return d.date;
    });

    data.dates.push(parseDate1("3-2020"));
    data.values = data.map(function (d) {
        return data.columns.slice(1).map(function (c) {
            return parseFloat(d[c]);
        });
    });

    // A color scale: one color for each group
    var myColor = d3.scaleOrdinal()
        .domain(data.columns.slice(1))
        .range(["#f3935c", "#d5d65b", "#5db760", "#F3600B", "#D4D60B", "#06B717"]);

    var myColorBorder = d3.scaleOrdinal()
        .domain(data.columns.slice(1))
        .range(["#f38a30", "#d1d626", "#1cb72e"]);

    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(data.dates))
        .range([margin.left, margin.left + width]);

    svg2.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (margin.top + height) + ")")
        .call(d3.axisBottom(x));
    data.dates.pop();

    var minY = d3.min(data.values.map(d => d3.min(d)));
    var maxY = d3.max(data.values.map(d => d3.max(d)));
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([minY, maxY])
        .nice()
        .range([margin.top + height, margin.top]);

    var yAxis = svg2.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(d3.axisLeft(y));
    yAxis.append("text")
        .attr("dy", "0.75em")
        .attr("x", 208)
        .attr("y", 30)
        .style("text-anchor", "end")
        .text("Labor productivity (output per hour)");
    yAxis.append("text")
        .attr("dy", "2em")
        .attr("x", 293)
        .attr("y", 30)
        .style("text-anchor", "end")
        .text("Percent change from previous quarter at annual rate");

    var center = d3.scaleLinear().range([margin.left, margin.left + width]);

    // Initialize line with group Business
    var selectedData = {
        column: "Business",
        values: data.map(function (d) {
            return {
                date: d.date,
                percent: d["Business"]
            };
        })
    };

    var rect = svg2.selectAll(".rect")
        .data(selectedData.values)
        .enter()
        .append("rect")
        .attr("class", "rect")
        .attr("x", d => x(d.date) + 2)
        .attr("y", d => {
            if (d.percent > 0) {
                return y(d.percent) - 1;
            } else {
                return y(0) + 1;
            }
        })
        .attr("width", 12)
        .attr("height", d => Math.abs(y(d.percent) - y(0)))
        .attr("fill", myColor("Business"))
        .style("stroke", myColorBorder("Business"));

    svg2.append("g")
        .attr("class", "center-axis")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.axisTop(center).ticks(0));

    // Add the annotation
    svg2.append("g").append("rect")
        .attr("x", x(data.dates[data.dates.length - 1]) + 2)
        .attr("y", y(maxY))
        .attr("width", 12)
        .attr("height", Math.abs(y(Math.ceil(minY) - 0.5) - y(Math.floor(maxY) + 1)))
        .style("fill", "#c8c8c8")
        .style("opacity", 0.5);

    svg2.append("g").append("text")
        .attr("class", "dot_label")
        .attr("x", x(data.dates[data.dates.length - 1]) - 16)
        .attr("y", y(maxY) - 8)
        .text("Qtr1-2020")
        .style('fill', "#c8c8c8");

    // Add the legend
    var dots = svg2.selectAll("dots")
        .data(data.columns.slice(1))
        .enter();
    dots.append("circle")
        .attr("class", "dots")
        .attr("cx", margin.left + width + 76)
        .attr("cy", function (d, i) {
            return margin.top + 22 + i * 20
        })
        .attr("r", 4)
        .style("fill", d => myColor(d));

    dots.append("text")
        .attr("class", "legend")
        .attr("x", margin.left + width + 84)
        .attr("y", function (d, i) {
            return margin.top + 24 + i * 20
        })
        .text(d => d)
        .style("alignment-baseline", "middle")
        .style("fill", d => myColor(d));

    dots.append("rect")
        .attr("class", "legend_rect")
        .attr("x", margin.left + width + 65)
        .attr("y", margin.top + 6)
        .attr("width", 150)
        .attr("height", 70);

    svg2.call(hover, rect, selectedData);

    // A function that update the chart
    function update() {

        d3.selectAll(".rect").remove();

        var selectedChoice = d3.selectAll(".slider").property("value");
        var selectedColumn = choiceToColumn[selectedChoice];

        console.log("selected: " + selectedColumn);

        // run the updateChart function with selected choice
        selectedData = {
            column: selectedColumn,
            values: data.map(function (d) {
                return {
                    date: d.date,
                    percent: d[selectedColumn]
                };
            })
        };

        rect = svg2.selectAll(".rect")
            .data(selectedData.values)
            .enter()
            .append("rect")
            .attr("class", "rect")
            .attr("x", d => x(d.date) + 2)
            .attr("y", d => {
                if (d.percent > 0) {
                    return y(d.percent) - 1;
                } else {
                    return y(0) + 1;
                }
            })
            .attr("width", 12)
            .attr("height", d => Math.abs(y(d.percent) - y(0)))
            .attr("fill", myColor(selectedData.column))
            .style("stroke", myColorBorder(selectedData.column));

        svg2.call(hover, rect, selectedData);
    }

    // When the slider is changed, run the updateChart function
    d3.selectAll(".slider").on("change", update);

    function hover(svg, rect, selectedData) {

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

        const label = svg.append("g")
            .attr("display", "none")
            .style('fill', myColor(selectedData.column));

        function moved() {
            d3.event.preventDefault();
            const mouse = d3.mouse(this);
            const xm = mouse[0];
            const ym = mouse[1];
            const i0 = d3.bisectLeft(data.dates, x.invert(xm), 1) - 1;
            const per = selectedData.values[i0].percent;
            const y0 = per < 0 ? y(0) + 1 : y(per) - 1;
            const y1 = per < 0 ? y(per) + 1 : y(0) - 1;
            label.selectAll("text").remove();

            if (xm - x(data.dates[i0]) <= 12 && ym >= y0 && ym <= y1) {
                rect.attr("fill", (d, i) => i === i0 ? myColor(selectedData.column) : "#ddd")
                    .style("stroke", (d, i) => i === i0 ? myColorBorder(selectedData.column) : "#5b5b5b");
                var dateStr = formatDate1(data.dates[i0]);
                var parts = dateStr.split("-");
                var qtr = (parseInt(parts[0]) + 2) / 3;
                var qtrStr = "Qtr" + qtr + "-" + parts[1];
                label.append("text")
                    .attr("class", "dot_label")
                    .attr("dy", "0em")
                    .attr("x", x(data.dates[i0]) - 4)
                    .attr("y", per < 0 ? y1 + 20 : y0 - 20)
                    .text(qtrStr);
                label.append("text")
                    .attr("class", "dot_label")
                    .attr("dy", "1em")
                    .attr("x", x(data.dates[i0]) - 4)
                    .attr("y", per < 0 ? y1 + 20 : y0 - 20)
                    .text(per);
            } else {
                rect.attr("fill", myColor(selectedData.column))
                    .style("stroke", myColorBorder(selectedData.column));
            }
        }

        function entered() {
            rect.style("mix-blend-mode", null).attr("stroke", "#ddd");
            label.attr("display", null);
        }

        function left() {
            rect.style("mix-blend-mode", "multiply").attr("stroke", d => {
                console.log(d.column);
                return myColor(d.column);
            });
            label.attr("display", "none");
        }
    }

}