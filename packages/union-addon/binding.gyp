{
  "targets": [
    {
      "target_name": "union_addon",
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
                "AdditionalDependencies": []
              }
            },
            "include_dirs": [
              "<!@(node -p \"require('node-addon-api').include\")",
              "<(module_root_dir)/lib/win"
            ],
            "libraries": [
              "<(module_root_dir)/lib/win/TOFDPort.lib"
            ],
            "copies": [
              {
                "destination": "<(PRODUCT_DIR)",
                "files": [
                  "<(module_root_dir)/lib/win/TOFDPort.dll",
                  "<(module_root_dir)/lib/win/ftd2xx.dll",
                  "<(module_root_dir)/lib/win/GainTable.ini"
                ]
              }
            ]
          }
        ]
      ]
    }
  ]
}
