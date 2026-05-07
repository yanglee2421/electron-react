{
  "targets": [
    {
      "target_name": "hello_addon",
      "sources": ["./src/hello.cpp"],
      "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
      "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
      "defines": [],
      "cflags!": [],
      "cflags_cc!": [],
      "conditions": [
        [
          "OS=='win'",
          {
            "libraries": ["-luser32.lib"],
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1,
                "AdditionalOptions": ["/utf-8"]
              },
              "VCLinkerTool": {
                "AdditionalDependencies": ["user32.lib"]
              }
            }
          }
        ],
        [
          "OS=='mac'",
          {
            "xcode_settings": { "GCC_ENABLE_CPP_EXCEPTIONS": "YES" }
          }
        ]
      ]
    }
  ]
}
