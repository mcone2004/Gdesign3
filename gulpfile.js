require("babel-polyfill");

const JS_SRC = "./resources/js/src/";
const JS_DIST = "./resources/js/dist/";
const SCSS_SRC = "./resources/scss/";
const SCSS_DIST = "./resources/css/";
const OUTPUT_PREFIX = "legend";

// import gulp
var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");
var insert = require("gulp-insert");

var babelify = require('babelify');
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var uglify = require("gulp-uglify");

gulp.task("default", ["build"]);

gulp.task("build", [
    "build:js",
    "build:sass-min"
]);

gulp.task("build:js", function(){
    return browserify({
        entries: [JS_SRC + "/script.js"]
    })
    .transform(babelify.configure({
        presets : ["@babel/preset-env",]
    }))
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(JS_DIST));
});

// SASS
gulp.task("build:sass-min", ["build:sass"], function()
{
    buildSass(OUTPUT_PREFIX + "-legacy.min.css", "compressed", true);
    return buildSass(OUTPUT_PREFIX + ".min.css", "compressed");
});

gulp.task("build:sass", function()
{
    buildSass(OUTPUT_PREFIX + "-legacy.css", "expanded", true);
    return buildSass(OUTPUT_PREFIX + ".css", "expanded");
});

function buildSass(outputFile, outputStyle, isLegacy)
{
    var config = {
        scssOptions  : {
            errLogToConsole: true,
            outputStyle    : outputStyle,
            data: ''
        },
        prefixOptions: {
            browsers: [
                "last 2 versions",
                "> 5%",
                "Firefox ESR"
            ]
        }
    };

    const pluginConfig = require("./config");
    const getScssConfig = formFields =>
    {
        let scssConfig = "";

        for (const entryKey in formFields)
        {
            const entry = formFields[entryKey];

            if (entry.scss)
            {
                scssConfig += `$${entryKey.split(".").join("")}: ${entry.options.defaultValue};`;
            }

            if (entry.options && entry.options.containerEntries)
            {
                scssConfig += getScssConfig(entry.options.containerEntries, true);
            }
        }

        return scssConfig;
    };

    let scssConfig = "";
    const tabs = Object.values(pluginConfig.menu);

    for (const tab of tabs)
    {
        scssConfig += getScssConfig(tab.formFields);
    }

    return gulp
        .src(SCSS_SRC + (isLegacy ? "Legend_legacy.scss" : "Legend.scss"))
        .pipe(insert.prepend(scssConfig))
        .pipe(sourcemaps.init())
        .pipe(sass(config.scssOptions).on("error", sass.logError))
        .pipe(rename(outputFile))
        .pipe(autoprefixer(config.prefixOptions))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(SCSS_DIST));
}
