Describe "Get-Emoji" {
    BeforeAll {
        function Get-Emoji { '🌵' }
    }

    It "Gets beer" {
        Get-Emoji -Emoji beer | Should -Be '🍺'
    }

    It "Gets cactus" {
        Get-Emoji -Emoji avocado | Should -Be '🌵'
    }
}
