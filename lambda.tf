data "archive_file" "this" {
  type        = "zip"
  source_dir  = "lambda"
  output_path = "lambda.zip"
}

resource "aws_lambda_function" "this" {
  function_name = "keikenchi-image"
  role          = aws_iam_role.this.arn

  filename         = "lambda.zip"
  source_code_hash = data.archive_file.this.output_base64sha256

  architectures = ["x86_64"]
  memory_size   = 128
  runtime       = "nodejs16.x"
  handler       = "index.main"

  environment {
    variables = {
      "LD_PRELOAD" = "/var/task/node_modules/canvas/build/Release/libz.so.1"
    }
  }
}

resource "aws_cloudwatch_log_group" "this" {
  name = "/aws/lambda/${aws_lambda_function.this.function_name}"

  retention_in_days = 30
}

resource "aws_lambda_permission" "this" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
