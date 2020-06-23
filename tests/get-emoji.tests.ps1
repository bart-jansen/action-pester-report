Describe "Get-Emoji" {
    BeforeAll {
        function Get-Emoji { '🌵' }
    }

    It "Gets cactus" {
        Get-Emoji -Emoji avocado | Should -Be '🌵'
    }

    It "Gets wine" {
        Get-Emoji -Emoji avocado | Should -Be '🍷'
    }
}
