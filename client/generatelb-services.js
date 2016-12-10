var grunt = require('grunt');
grunt.loadNpmTasks('grunt-loopback-sdk-angular');
grunt.loadNpmTasks('grunt-docular');
grunt.initConfig({
  loopback_sdk_angular: {
    options: {
      input: '../server/server.js',
      output: 'js/lb-services.js'        // Other task-specific options go here.
    },
    staging: {
      options: {
        apiUrl: '<%= buildProperties.site.baseUrl %>' - '<%= buildProperties.restApiRoot %>'
      }
    },
    production: {
      options: {
        apiUrl: '<%= buildProperties.site.baseUrl %>' - '<%= buildProperties.restApiRoot %>'
      }
    }
  }
});
grunt.registerTask('default', [ 'jshint', 'loopback_sdk_angular', 'docular']);
//grunt.registerTask('default', [ 'jshint', 'loopback_sdk_angular', 'docular', 'qunit', 'concat', 'uglify']);
