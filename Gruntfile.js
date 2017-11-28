module.exports = function (grunt) {
    grunt.initConfig({
        copy: {
            css: {
                expand: true,
                cwd: 'src/css',
                src: '**/*.css',
                dest: 'dist/css'
            },
            json: {
                expand: true,
                cwd: 'src/json',
                src: '**/*.json',
                dest: 'dist/json'
            }

        },
        uglify: {
            buildviews: {
                options: {
                    mangle: true, //混淆变量名
                    preserveComments: false //all不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
                },
                files: [{
                    expand: true,
                    cwd: 'src', //js目录下
                    src: '**/*.js', //所有js文件
                    dest: 'dist' //输出到此目录下
                }]
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                removeCommentsFromCDATA: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeOptionalTags: true
            },
            html: {
                files: [{
                    expand: true,
                    cwd: 'src/html',
                    src: ['**/*.html'],
                    dest: 'dist/html'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('buildall', ['uglify:buildviews', 'htmlmin', 'copy']);

};