package net.hpass.hpass

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
//import androidx.compose.foundation.layout.ColumnScopeInstance.align
//import androidx.compose.foundation.layout.ColumnScopeInstance.align
//import androidx.compose.foundation.layout.ColumnScopeInstance.weight
//import androidx.compose.foundation.layout.ColumnScopeInstance.weight
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
//import androidx.compose.foundation.layout.RowScopeInstance.weight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.ButtonColors
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Divider
import androidx.compose.material.LocalTextStyle
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.material.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
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
        var generatedPasswords by remember { mutableStateOf(listOf<String>()) }

        Column(
//            modifier = Modifier.fillMaxWidth(0.75f),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        )
        {
            Text(
                text = "Length in 1-7 range",
                fontFamily = FontFamily.SansSerif,
                fontSize = 24.sp,
                modifier = Modifier.padding(16.dp),
//                textAlign = TextAlign.Center
            )
            var text by remember { mutableStateOf(TextFieldValue("")) }
            TextField(
                value = text,
                modifier = Modifier
                    .fillMaxWidth(0.75f)
                    .padding(top = 16.dp, bottom = 16.dp)
                    .background(androidx.compose.ui.graphics.Color(0xffadd8e6)),
                onValueChange = {
                    text = it
                },
                label = {
                    Text(
//                    style = TextStyle(fontStyle = Color(0xff005500)),
//                    color = Color.LightGray,
                        color = Color(0xff999999),
                        text = "hint to generate password"
                    )
                },
//                placeholder = { Text(text = "Your password hint") },
            )
            Column(modifier = Modifier.fillMaxWidth(0.75f)) {
//                var saltState by remember { mutableStateOf(TextFieldValue("bbb")) }
//                var saltText by remember { mutableStateOf(TextFieldValue("salt")) }
//                var pepperState by remember { mutableStateOf(TextFieldValue("ZZZ")) }
//                var lengthState by remember { mutableStateOf(TextFieldValue("6")) }

                hpassRow("Salt:", "salt")
//                SaltTextField()
                hpassRow("Pepper:", "ZZZ")
                hpassRowNumber("Length:", "6")

                Button(
                    modifier = Modifier
                        .padding(top = 16.dp)
                        .fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(Color(0xff90ee90)),
//                    content = RowScope(),
                    onClick = {
                        val generatedPassword: String = generatePassword(
//                            passwordHint,
//                            salt,
//                            pepper,
//                            passwordLength
                        )
                        generatedPasswords = generatedPasswords + generatedPassword
                    }
                ) {
                    Text(
                        text = "Generate and copy to clipboard",
                        fontFamily = FontFamily.SansSerif,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xff333333)
                    )
                }
                Divider(
                    color = Color.Red,
                    thickness = 1.dp,
                    modifier = Modifier.padding(16.dp)
                )
                LazyColumnWithAutoScroll2(generatedPasswords)
//                LazyColumn(
//                    reverseLayout = true,
//                    userScrollEnabled = true,
//                    modifier = Modifier.weight(1f)
//                ) {
//                    items(generatedPasswords) { password ->
//                        Text(
//                            text = password,
//                            modifier = Modifier.padding(bottom = 8.dp)
//                        )
//                    }
//                }
                Divider(
                    color = Color.Red,
                    thickness = 1.dp,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}

@Composable
fun LazyColumnWithAutoScroll(itemlist: List<String>) {
    // This variable remembers the state of the LazyColumn.
    val listState = rememberLazyListState()

    // This function scrolls the LazyColumn to the bottom when new items are added.
    LaunchedEffect(itemlist.size) {
        if (!listState.isScrolledToTheEnd()) {
            listState.animateScrollToItem(itemlist.size - 1)
        }
    }

    // This function displays the items in the LazyColumn.
    LazyColumn(
        reverseLayout = true,
        userScrollEnabled = true,
//        modifier = Modifier.weight(1f),
        state = listState
//        reverseLayout = true
    ) {
        items(itemlist) { item ->
            Text(text = item)
        }
    }
}


fun LazyListState.isScrolledToTheEnd(): Boolean {
    val lastItem = layoutInfo.visibleItemsInfo.lastOrNull()
    return lastItem == null || lastItem.size + lastItem.offset <= layoutInfo.viewportEndOffset
}

@Composable
fun LazyColumnWithAutoScroll2(itemlist: List<String>) {
    val lazyColumnListState = rememberLazyListState()
    val corroutineScope = rememberCoroutineScope()


    LazyColumn(
//        modifier = Modifier.fillMaxHeight(0.4f),
        reverseLayout = true,
        state = lazyColumnListState

    ) {

        itemsIndexed(itemlist) { index, string ->
            Text(
                modifier = Modifier.fillMaxWidth(1f),
                text = string,
                textAlign = TextAlign.Center,
                fontSize = 24.sp
            )
            corroutineScope.launch {
                lazyColumnListState.scrollToItem(itemlist.size - 1)
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
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            modifier = Modifier
                .padding(end = 16.dp)
                .fillMaxWidth(0.25f),
            fontWeight = FontWeight.Bold,
            text = s
        ) // this is the label
        TextField(
            value = text,
            textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.End),
            modifier = Modifier.padding(top = 16.dp, bottom = 16.dp),
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
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = s,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .padding(end = 16.dp)
                .fillMaxWidth(0.25f)
        ) // this is the label
        TextField(
            value = text,
            modifier = Modifier
                .padding(top = 16.dp, bottom = 16.dp)
                .fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            onValueChange = { it ->
                text = it
            },
            placeholder = { Text(text = initial) },
        )
    }
}

@Composable
fun SaltTextField() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = "Salt",
            style = MaterialTheme.typography.body1,
        )
        TextField(
            value = "salty",
            onValueChange = {},
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .background(Color.White)
                .border(
                    width = 1.dp,
                    color = Color.Gray,
                ),
        )
    }
}

private fun generatePassword(/*hint: String, salt: String, pepper: String, length: Int*/): String {
    // Generate the password based on the provided inputs
    // Implement your password generation logic here
    // ...
    val length = 4
//  return "password1" // Return the generated password
    val chars = ('a'..'z') + ('A'..'Z') + ('0'..'9')
    val password = (1..length)
        .map { chars.random() }
        .joinToString("")
    return password
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