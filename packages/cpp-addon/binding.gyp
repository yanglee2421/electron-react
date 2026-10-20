{
  "targets": [
    {
      "target_name": "cpp_addon",
      "sources": [
        "<!@(node get-source-file.cjs)"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "conditions": [
        [
          "OS=='linux'",
          {
            "include_dirs": [
              "<!@(node -p \"require('node-addon-api').include\")"
            ],
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
            },
            "include_dirs": [
              "<!@(node -p \"require('node-addon-api').include\")"
            ],
            "libraries": []
          }
        ]
      ]
    }
  ]
}
