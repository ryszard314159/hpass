package net.hpass.hpass

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.material.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.tooling.preview.Preview
import net.hpass.hpass.ui.theme.HpassTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HpassTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colors.background
                ) {
                    hpassSplash()
                }
            }
        }
    }

    @Preview
    @Composable
    private fun hpassSplash() {
        Column(verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally)
        {
            Text(
                text = "Length in 1-7 range",
//                textAlign = TextAlign.Center
            )
            var text by remember { mutableStateOf(TextFieldValue("")) }
            TextField(
                value = text,
                onValueChange = {
                    text = it
                },
                label = { Text(text = "hint to generate password") },
                placeholder = { Text(text = "Your password hint") },
            )
            Column() {
//                var saltState by remember { mutableStateOf(TextFieldValue("bbb")) }
//                var saltText by remember { mutableStateOf(TextFieldValue("salt")) }
//                var pepperState by remember { mutableStateOf(TextFieldValue("ZZZ")) }
//                var lengthState by remember { mutableStateOf(TextFieldValue("6")) }

                hpassRow("Salt", "salt")
                hpassRow("Pepper:", "ZZZ")
                hpassRowNumber("Length:", "6")

                Button(
                    onClick = { /*TODO*/ }) {
                    
                }

            }
        }
    }
}

@Composable
//private fun hpassRow(s: String, /* hint: String,*/ valueState: TextFieldValue) {
private fun hpassRow(s: String, initial: String) {
//    var myHint = hint
//    var text = valueState
    var text by remember { mutableStateOf(TextFieldValue("")) }
    Row() {
        Text(text = s + ":") // this is the label
        TextField(
            value = text,
            onValueChange = {
                text = it
            },
//            label = { Text(text = "toplabel " + s) },
            placeholder = { Text(text = initial) },
        )
    }
}
@Composable
private fun hpassRowNumber(s: String, initial: String) {
    var text by remember { mutableStateOf(TextFieldValue("")) }
    Row() {
        Text(text = s + ":") // this is the label
        TextField(
            value = text,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            onValueChange = { it ->
                text = it
            },
            placeholder = { Text(text = initial) },
        )
    }
}

@Composable
fun Greeting(name: String) {
    Text(text = "Hello $name!")
}

@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    HpassTheme {
        Greeting("Android")
    }
}