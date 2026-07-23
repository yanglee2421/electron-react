{
  "targets": [
    {
      "target_name": "cpp_addon",
      "sources": [
        "<!@(node get-source-file.cjs)"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "conditions": [
        [
          "OS=='linux'",
          {
            "cflags": [
              "-fpermissive",
              "-fexceptions"
            ],
            "cflags_cc": [
              "-fpermissive",
              "-fexceptions"
            ]
          }
        ],
        [
          "OS=='win'",
          {
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1,
                "AdditionalOptions": [
                  "/utf-8"
                ]
              },
              "VCLinkerTool": {
                "AdditionalDependencies": [
                  "user32.lib"
                ]
              }
            }
          }
        ]
      ]
    }
  ]
}